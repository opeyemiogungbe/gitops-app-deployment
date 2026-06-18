# Gitops application deployment

## Project Overview

This project demonstrates a GitOps-based application deployment workflow using Kubernetes, Kustomize, GitHub Actions, GitHub Container Registry, and Argo CD.

The main idea is simple: Git is the source of truth. Instead of manually deploying Kubernetes resources with repeated `kubectl apply` commands, the desired state of the application is stored as YAML in this repository. Argo CD watches the repository, compares the live cluster with the Git state, and automatically reconciles the cluster when changes are pushed.

In this updated version of the project, Argo CD itself is configured declaratively through YAML manifests. That means the Argo CD Applications for development, staging, and production are also stored in Git.

The result is a cleaner deployment workflow:

```text
Developer pushes code or manifest changes
        |
        v
GitHub Actions builds and publishes the container image
        |
        v
Argo CD detects Git changes
        |
        v
Argo CD syncs the correct Kustomize overlay to Kubernetes
```

This keeps build and deployment responsibilities separate. GitHub Actions builds the image. Argo CD deploys the Kubernetes manifests.

## What This Project Deploys

The project deploys a simple Node.js application to Kubernetes across three environments:

| Environment | Git Branch | Kustomize Path | Argo CD App | Namespace |
|---|---|---|---|---|
| Development | `dev` | `overlay/dev` | `kustomize-dev` | `dev` |
| Staging | `staging` | `overlay/staging` | `kustomize-staging` | `staging` |
| Production | `main` | `overlay/prod` | `kustomize-prod` | `prod` |

Each environment inherits the shared Kubernetes configuration from `base/` and applies its own environment-specific patches through Kustomize.

## Repository Structure

```text
gitops-app-deployment/
|-- .github/
|   `-- workflows/
|       `-- main.yaml
|-- app/
|   `-- index.js
|-- argocd/
|   |-- application-dev.yaml
|   |-- application-staging.yaml
|   |-- application-prod.yaml
|   `-- kustomization.yaml
|-- base/
|   |-- deployment.yaml
|   |-- service.yaml
|   `-- kustomization.yaml
|-- overlay/
|   |-- dev/
|   |   |-- deployment_patch.yaml
|   |   |-- replica_count.yaml
|   |   `-- kustomization.yaml
|   |-- staging/
|   |   |-- deployment_patch.yaml
|   |   |-- replica_count.yaml
|   |   |-- service_patch.yaml
|   |   `-- kustomization.yaml
|   `-- prod/
|       |-- deployment_patch.yaml
|       |-- replica_count.yaml
|       `-- kustomization.yaml
|-- Dockerfile
|-- package.json
`-- README.md
```

## Key Directories

| Path | Purpose |
|---|---|
| `app/` | Node.js application source code |
| `base/` | Shared Kubernetes Deployment, Service, ConfigMap, and Secret definitions |
| `overlay/dev` | Development-specific Kustomize configuration |
| `overlay/staging` | Staging-specific Kustomize configuration |
| `overlay/prod` | Production-specific Kustomize configuration |
| `argocd/` | Declarative Argo CD Application manifests |
| `.github/workflows/` | GitHub Actions workflow for building and pushing images |

## Architecture

```text
GitHub Repository
  |-- Application source code
  |-- Kubernetes base manifests
  |-- Kustomize overlays
  `-- Argo CD Application manifests

GitHub Actions
  `-- Builds and pushes images to GitHub Container Registry

Argo CD
  `-- Watches Git branches and syncs Kubernetes resources

Kubernetes Cluster
  `-- Runs the deployed application workloads
```

Argo CD does not build Docker images. It only deploys the Kubernetes desired state from Git.

## Declarative Argo CD Applications

The Argo CD Applications are defined in the `argocd/` directory:

```text
argocd/application-dev.yaml
argocd/application-staging.yaml
argocd/application-prod.yaml
```
![Screenshot-2026-06-18-032019.png](https://i.postimg.cc/Dfbnr4hS/Screenshot-2026-06-18-032019.png)

![Screenshot-2026-06-18-032043.png](https://i.postimg.cc/fTNnYH5j/Screenshot-2026-06-18-032043.png)

![Screenshot-2026-06-18-032104.png](https://i.postimg.cc/L6XkQSy1/Screenshot-2026-06-18-032104.png)

Each file tells Argo CD:

- Which Git repository to watch
- Which branch to track
- Which Kustomize overlay path to render
- Which Kubernetes namespace to deploy into
- Whether automated sync, pruning, and self-healing should be enabled


## Bootstrapping Argo CD

Before Argo CD can deploy from the repository, the Argo CD Application objects must exist in the cluster.

Apply them one time:

```bash
kubectl apply -f argocd/application-dev.yaml
kubectl apply -f argocd/application-staging.yaml
kubectl apply -f argocd/application-prod.yaml
```
![Screenshot-2026-06-18-035311.png](https://i.postimg.cc/J7gtmWrx/Screenshot-2026-06-18-035311.png)

Or apply all three together using the `argocd/kustomization.yaml` bundle:

```bash
kubectl apply -k argocd
```

After this bootstrap step, Argo CD starts managing the three environments automatically.

## Syncing Behavior

Once the Argo CD Applications are registered, Argo CD continuously compares Git state with the live Kubernetes cluster.

Each application watches its own branch and path:

```text
kustomize-dev      -> dev branch      -> overlay/dev
kustomize-staging  -> staging branch  -> overlay/staging
kustomize-prod     -> main branch     -> overlay/prod
```

If a change is pushed to `dev`, only the development application's desired state changes. Staging and production may still be checked by Argo CD, but they will not receive the dev change because they track different branches.

The sync policy enables:

| Setting | Meaning |
|---|---|
| `automated` | Argo CD can sync changes without manual approval |
| `prune: true` | Resources removed from Git are removed from the cluster |
| `selfHeal: true` | Manual cluster drift is corrected back to Git state |
| `CreateNamespace=true` | Argo CD can create the target namespace automatically |

## Deployment Flow

The normal workflow is:

1. Make a code or manifest change.
2. Commit the change to the correct environment branch.
3. Push the branch to GitHub.
4. GitHub Actions builds and pushes the container image.
5. Argo CD detects the Git change.
6. Argo CD renders the Kustomize overlay.
7. Argo CD syncs the resources into Kubernetes.

Example:

```bash
git checkout dev
git add .
git commit -m "Update development deployment"
git push origin dev
```

Argo CD then syncs `kustomize-dev`.

![Screenshot-2026-06-18-043232.png](https://i.postimg.cc/Zq7vdvSf/Screenshot-2026-06-18-043232.png)

Note: the argocd ui above show all our deployment 

## GitHub Actions Role

GitHub Actions is responsible for building the Docker image and pushing it to GitHub Container Registry.

It does not deploy directly to Kubernetes.

This is intentional:

```text
GitHub Actions -> build artifact
Argo CD        -> deploy artifact
Git            -> source of truth
```

If GitHub Actions fails to push an image, Argo CD can still sync the YAML. However, the Kubernetes pods may continue running an older image or fail with `ImagePullBackOff` if the referenced image tag does not exist.

## Health Status

Argo CD reports both sync status and health status.

| Status | Meaning |
|---|---|
| `Synced` | The live Kubernetes resources match the manifests in Git |
| `OutOfSync` | The cluster differs from the desired state in Git |
| `Healthy` | Kubernetes reports that the application resources are running correctly |
| `Progressing` | Resources are still being created or updated |
| `Degraded` | One or more resources are failing |

An application can be `Synced` but not `Healthy`. For example, the YAML may apply successfully, but a pod can still fail if the image cannot be pulled.

Useful checks:

```bash
kubectl get applications -n argocd
kubectl describe application kustomize-dev -n argocd
kubectl get pods -n dev
kubectl get svc -n dev
```
![Screenshot-2026-06-18-035728.png](https://i.postimg.cc/JhDMpsXT/Screenshot-2026-06-18-035728.png)

## Rollback Strategy

The recommended GitOps rollback method is to revert the bad Git commit and push the revert.

Example:

```bash
git checkout dev
git revert <bad-commit-sha>
git push origin dev
```

Argo CD sees the new Git state and syncs the cluster back to the reverted version.

This keeps Git as the source of truth and preserves a clean audit trail.

You can also roll back from the Argo CD UI or CLI:

```bash
argocd app history kustomize-dev
argocd app rollback kustomize-dev <history-id>
```

However, if automated sync is enabled and Git still points to the bad version, Argo CD may eventually sync back to that Git state. For this reason, Git-based rollback is usually the safest and cleanest approach.

## Application Deletion

When deleting an Argo CD Application, the deletion propagation policy controls what happens to the resources it manages.

| Policy | Behavior |
|---|---|
| `Foreground` | Deletes child resources first, then removes the Application |
| `Background` | Deletes the Application and lets Kubernetes clean up child resources afterward |
| `Non-cascading` | Deletes only the Argo CD Application; workloads remain running |

For normal cleanup, `Foreground` is a good default. Use `Non-cascading` only when you want Argo CD to stop managing the app but leave the Kubernetes resources in place.

## Useful Commands

Render Kustomize overlays locally:

```bash
kubectl kustomize overlay/dev
kubectl kustomize overlay/staging
kubectl kustomize overlay/prod
```

Register Argo CD Applications:

```bash
kubectl apply -k argocd
```

Check Argo CD Applications:

```bash
kubectl get applications -n argocd
kubectl describe application kustomize-dev -n argocd
kubectl describe application kustomize-staging -n argocd
kubectl describe application kustomize-prod -n argocd
```

Check workloads:

```bash
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod
```

## Troubleshooting

### Argo CD Did Not Deploy After a Push

Confirm the Application exists:

```bash
kubectl get applications -n argocd
```

Confirm the app is watching the correct branch and path:

```bash
kubectl describe application kustomize-dev -n argocd
```

### GitHub Actions Failed With `write_package`

This means GitHub Actions could not push the image to GitHub Container Registry.

Check:

- Repository workflow permissions allow read and write access.
- The workflow has `packages: write`.
- The GHCR package allows this repository to publish images.

### Application Is Synced But Pods Are Failing

Check pod events:

```bash
kubectl describe pod <pod-name> -n dev
```

Common causes include missing images, private image permissions, bad environment variables, or failing application startup.

### Staging or Prod Synced Even Without a New Push

If the Argo CD Applications were newly created, Argo CD performs an initial reconciliation for all registered apps. This is expected. Each app still tracks its own configured branch.

## Summary

This project now follows a clean GitOps workflow:

- Kubernetes manifests live in Git.
- Kustomize manages environment differences.
- Argo CD Applications are declared as YAML.
- GitHub Actions builds and pushes container images.
- Argo CD syncs the cluster to match Git.
- Rollbacks are handled cleanly through Git history.

With this structure, deployment is repeatable, auditable, and easier to manage across development, staging, and production.
