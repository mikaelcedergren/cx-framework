#!/usr/bin/env python3
"""Discover whether Cleaner is operating on one repository or a workspace."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path


SKIP_DIRS = {
    ".angular",
    ".cache",
    ".git",
    ".gradle",
    ".next",
    ".nuxt",
    ".pnpm-store",
    ".pytest_cache",
    ".turbo",
    ".venv",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
    "vendor",
}

MANIFESTS = (
    "package.json",
    "pnpm-workspace.yaml",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "composer.json",
    "Gemfile",
    "Makefile",
    "nx.json",
    "turbo.json",
)

MEMORY_CANDIDATES = (
    "MEMORY.md",
    "PROJECT_MEMORY.md",
    "memory.md",
    ".codex/memory.md",
    ".agents/memory.md",
)

WORKSPACE_DOCS = (
    "AGENTS.md",
    "PROJECTS.md",
    "README.md",
)


def run_git(path: Path, *args: str) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(path), *args],
            check=False,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def containing_git_root(path: Path) -> Path | None:
    root = run_git(path, "rev-parse", "--show-toplevel")
    return Path(root).resolve() if root else None


def is_repository(path: Path) -> bool:
    return (path / ".git").exists()


def discover_nested_repositories(root: Path, max_depth: int) -> list[Path]:
    repositories: set[Path] = set()

    def ignore_error(_: OSError) -> None:
        return

    for current, dirs, files in os.walk(root, topdown=True, onerror=ignore_error):
        current_path = Path(current)
        try:
            depth = len(current_path.relative_to(root).parts)
        except ValueError:
            continue

        if ".git" in dirs or ".git" in files or (current_path == root and is_repository(root)):
            repositories.add(current_path.resolve())

        dirs[:] = [name for name in dirs if name not in SKIP_DIRS]
        if depth >= max_depth:
            dirs[:] = []

    return sorted(repositories, key=lambda item: str(item).lower())


def existing_relative_files(root: Path, candidates: tuple[str, ...]) -> list[str]:
    return [candidate for candidate in candidates if (root / candidate).is_file()]


def repository_info(root: Path, scope_root: Path) -> dict[str, object]:
    status = run_git(root, "status", "--short")
    status_lines = status.splitlines() if status else []
    branch = run_git(root, "branch", "--show-current") or None
    try:
        relative = str(root.relative_to(scope_root)) or "."
    except ValueError:
        relative = str(root)

    return {
        "path": str(root),
        "relative_path": relative,
        "branch": branch,
        "dirty": bool(status_lines),
        "changed_entry_count": len(status_lines),
        "manifests": existing_relative_files(root, MANIFESTS),
        "instruction_files": existing_relative_files(root, ("AGENTS.md",)),
        "memory_candidates": existing_relative_files(root, MEMORY_CANDIDATES),
    }


def discover(start: Path, max_depth: int) -> dict[str, object]:
    start = start.expanduser().resolve()
    if not start.is_dir():
        raise ValueError(f"Start path is not a directory: {start}")

    containing_root = containing_git_root(start)

    if containing_root is not None and start != containing_root:
        mode = "single-repository"
        scope_root = containing_root
        repositories = [containing_root]
    else:
        scan_root = containing_root if containing_root is not None else start
        repositories = discover_nested_repositories(scan_root, max_depth)
        if not repositories and containing_root is not None:
            repositories = [containing_root]

        if len(repositories) > 1:
            mode = "multi-repository-workspace"
            scope_root = start
        elif len(repositories) == 1:
            mode = "single-repository"
            scope_root = repositories[0]
        else:
            mode = "single-directory"
            scope_root = start

    return {
        "invocation_path": str(start),
        "scope_root": str(scope_root),
        "mode": mode,
        "ledger_path": str(scope_root / "temp" / "CLEANUP.md"),
        "workspace_documents": existing_relative_files(scope_root, WORKSPACE_DOCS),
        "workspace_memory_candidates": existing_relative_files(scope_root, MEMORY_CANDIDATES),
        "repositories": [repository_info(repo, scope_root) for repo in repositories],
        "notes": [
            "Repository roles and active/excluded status require instruction and workspace-document evidence.",
            "Memory candidates are not authoritative until local instructions identify the canonical project memory.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", default=".", help="Invocation directory")
    parser.add_argument(
        "--max-depth",
        type=int,
        default=4,
        help="Maximum directory depth when discovering nested repositories",
    )
    args = parser.parse_args()

    try:
        result = discover(Path(args.path), max(1, args.max_depth))
    except ValueError as error:
        parser.error(str(error))

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
