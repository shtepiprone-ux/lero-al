from __future__ import annotations

import fnmatch
import os
from pathlib import Path
from typing import Iterable

import typer
from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

app = typer.Typer()
console = Console()

PROJECT_ROOT = Path.cwd()
TASKS_FILE = PROJECT_ROOT / "tasks" / "claude_code_tasks.txt"
IGNORE_FILE = PROJECT_ROOT / ".orchestratorignore"

MAX_FILE_CHARS = 24_000
MAX_TOTAL_CONTEXT_CHARS = 180_000

ALLOWED_WRITE_FILES = {
    TASKS_FILE.resolve(),
}


def safe_resolve(path: Path) -> Path:
    return path.resolve(strict=False)


def assert_write_allowed(path: Path) -> None:
    resolved = safe_resolve(path)

    if resolved not in ALLOWED_WRITE_FILES:
        raise PermissionError(
            f"Write denied: {resolved}\n"
            f"Orchestrator may write only to: {TASKS_FILE}"
        )


def load_ignore_patterns() -> list[str]:
    if not IGNORE_FILE.exists():
        return []

    patterns: list[str] = []

    for raw_line in IGNORE_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        patterns.append(line)

    return patterns


def is_ignored(path: Path, patterns: Iterable[str]) -> bool:
    rel = path.relative_to(PROJECT_ROOT).as_posix()

    for pattern in patterns:
        clean = pattern.strip()

        if clean.startswith("!"):
            continue

        if clean.endswith("/"):
            folder = clean.rstrip("/")
            if rel == folder or rel.startswith(folder + "/"):
                return True

        if fnmatch.fnmatch(rel, clean):
            return True

        if fnmatch.fnmatch(path.name, clean):
            return True

    return False


def is_probably_text_file(path: Path) -> bool:
    allowed_suffixes = {
        ".md",
        ".txt",
        ".json",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".css",
        ".scss",
        ".html",
        ".yml",
        ".yaml",
        ".toml",
        ".mjs",
        ".cjs",
    }

    return path.suffix.lower() in allowed_suffixes


def collect_project_context() -> str:
    patterns = load_ignore_patterns()
    chunks: list[str] = []
    total = 0

    priority_files = [
        "docs/ai-behavior.md",
        "docs/backlog.md",
        "docs/ui-rules.md",
        "docs/component-rules.md",
        "docs/responsive-governance.md",
        "docs/component-governance.md",
        "docs/tailwind-governance.md",
        "tasks/claude_code_tasks.txt",
        "claude_code_tasks.txt",
    ]

    candidate_files: list[Path] = []

    for rel in priority_files:
        path = PROJECT_ROOT / rel
        if path.exists() and path.is_file():
            candidate_files.append(path)

    for path in PROJECT_ROOT.rglob("*"):
        if not path.is_file():
            continue

        if path in candidate_files:
            continue

        if is_ignored(path, patterns):
            continue

        if not is_probably_text_file(path):
            continue

        rel = path.relative_to(PROJECT_ROOT).as_posix()

        if rel.startswith("docs/") or rel.startswith("tasks/"):
            candidate_files.append(path)

    for path in candidate_files:
        if is_ignored(path, patterns):
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        if not text.strip():
            continue

        rel = path.relative_to(PROJECT_ROOT).as_posix()
        text = text[:MAX_FILE_CHARS]

        block = f"\n\n===== FILE: {rel} =====\n{text}"

        if total + len(block) > MAX_TOTAL_CONTEXT_CHARS:
            break

        chunks.append(block)
        total += len(block)

    return "".join(chunks)


def get_client() -> OpenAI:
    load_dotenv(PROJECT_ROOT / ".env")

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing in .env")

    return OpenAI(api_key=api_key)


@app.command()
def create_task(
    title: str = typer.Argument(..., help="Task title or phase name"),
    mode: str = typer.Option("append", help="append or replace"),
) -> None:
    """
    Generate a Claude Code task and write it only to tasks/claude_code_tasks.txt.
    """

    if mode not in {"append", "replace"}:
        raise typer.BadParameter("mode must be append or replace")

    assert_write_allowed(TASKS_FILE)

    context = collect_project_context()
    client = get_client()
    model = os.getenv("OPENAI_MODEL", "gpt-5.5")

    prompt = f"""
You are a read-only project orchestrator.

You MUST NOT write source code.
You MUST NOT modify project files except generating task text for tasks/claude_code_tasks.txt.
You generate complete Claude Code Sonnet 4.6 tasks.

Create one complete Claude Code task for:

{title}

Requirements:
- Follow the style of existing claude_code_tasks.txt tasks.
- Include "Before starting this task, Claude Code MUST read and follow these docs".
- Include strict scope rules.
- Include deliverables.
- Include documentation requirements.
- Include validation checklist.
- Include final report requirements.
- Cover all locales: sq, en, uk, it.
- Cover all breakpoints:
  320, 360, 375, 390, 412, 480, 640, 768, 1024, 1280, 1440, 1720, 1920, 2560, ultrawide.
- Respect backlog.md compact-session-log rules.
- Do not instruct Claude Code to store long logs directly in docs/backlog.md.
- Output ONLY the task text, no markdown fence.

PROJECT CONTEXT:
{context}
"""

    response = client.responses.create(
        model=model,
        input=prompt,
    )

    task_text = response.output_text.strip() + "\n"

    TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)

    if mode == "replace":
        TASKS_FILE.write_text(task_text, encoding="utf-8")
    else:
        existing = TASKS_FILE.read_text(encoding="utf-8") if TASKS_FILE.exists() else ""
        separator = "\n\n----------------------------------------------------------------------------------\n\n" if existing.strip() else ""
        TASKS_FILE.write_text(existing.rstrip() + separator + task_text, encoding="utf-8")

    console.print(f"[green]Task written to:[/green] {TASKS_FILE}")


@app.command()
def check_access() -> None:
    """
    Verify read context and write permissions.
    """

    context = collect_project_context()

    console.print("[green]Read context collected successfully.[/green]")
    console.print(f"Context size: {len(context)} characters")
    console.print(f"Allowed write file: {TASKS_FILE}")

    assert_write_allowed(TASKS_FILE)
    console.print("[green]Write guard OK.[/green]")


def answer_natural_language(user_input: str) -> None:
    """
    Answer free-form Ukrainian/English orchestrator questions without writing files.
    """

    load_dotenv(PROJECT_ROOT / ".env")

    client = get_client()
    model = os.getenv("OPENAI_MODEL", "gpt-5.5")

    context = collect_project_context()

    prompt = f"""
You are a read-only ChatGPT project orchestrator for this repository.

You may:
- answer questions,
- explain project state,
- help plan epics,
- help review task structure,
- suggest commands,
- explain how to use this orchestrator.

You MUST NOT:
- write source code,
- claim you changed files,
- expose secrets,
- read ignored files,
- modify repository files.

Write in the same language as the user.
The user may write Ukrainian, English, or mixed text.

User message:
{user_input}

Project context:
{context}
"""

    response = client.responses.create(
        model=model,
        input=prompt,
    )

    console.print(response.output_text.strip())



@app.command()
def shell() -> None:
    """
    Start interactive ChatGPT orchestrator shell.
    """

    load_dotenv(PROJECT_ROOT / ".env")

    logo = r"""
      ____ _           _    ____ ____ _____
     / ___| |__   __ _| |_ / ___|  _ \_   _|
    | |   | '_ \ / _` | __| |  _| |_) || |
    | |___| | | | (_| | |_| |_| |  __/ | |
     \____|_| |_|\__,_|\__|\____|_|    |_|

              Project Orchestrator
    """

    panel_text = Text()
    panel_text.append(logo, style="bold green")
    panel_text.append("\n")
    panel_text.append("Model: ", style="dim")
    panel_text.append(os.getenv("OPENAI_MODEL", "gpt-5.5"), style="bold")
    panel_text.append("\nMode: ", style="dim")
    panel_text.append("read-only repo access + write only to tasks/claude_code_tasks.txt", style="bold cyan")
    panel_text.append("\n\n")
    panel_text.append("Commands:\n", style="bold")
    panel_text.append("  task <title>   ", style="green")
    panel_text.append("Generate a Claude Code task\n")
    panel_text.append("  check          ", style="green")
    panel_text.append("Verify read/write guards\n")
    panel_text.append("  exit           ", style="green")
    panel_text.append("Quit\n")

    console.print(Panel(panel_text, border_style="green"))

    while True:
        try:
            user_input = input("chatgpt> ").strip()
        except KeyboardInterrupt:
            console.print("\n[yellow]Exit.[/yellow]")
            break

        if not user_input:
            continue

        if user_input.lower() in {"exit", "quit", "q"}:
            console.print("[yellow]Exit.[/yellow]")
            break

        if user_input.lower() == "check":
            check_access()
            continue

        if user_input.lower().startswith("task "):
            title = user_input[5:].strip()

            if not title:
                console.print("[red]Task title is empty.[/red]")
                continue

            create_task(title=title, mode="append")
            continue

        task_keywords = [
            "task ",
            "?????",
            "????",
            "?????? ??????",
            "??????? ??????",
            "???????? ??????",
            "???????? ??????",
            "create task",
            "generate task",
        ]

        lowered = user_input.lower()

        if any(keyword in lowered for keyword in task_keywords):
            create_task(title=user_input, mode="append")
            continue

        answer_natural_language(user_input)


if __name__ == "__main__":
    app()