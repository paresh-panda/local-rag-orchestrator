import sys
import os
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.markdown import Markdown
from prompt_toolkit import PromptSession
from prompt_toolkit.history import InMemoryHistory

# Ensure root pathing
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src import PDFInsightsEngine

def run_tui():
    console = Console()
    engine = PDFInsightsEngine()
    
    # Initialize interactive session with built-in history navigation
    session = PromptSession(history=InMemoryHistory())

    while True:
        # 1. Display Layout
        console.clear()
        # (Simplified layout for readability)
        console.print(Panel("[bold blue]Local RAG Orchestrator[/bold blue]\nArrow keys navigate history!", expand=True))
        
        # 2. Get Input using PromptSession (This handles history automatically)
        try:
            # The 'bottom_toolbar' keeps the prompt inside the visual flow
            question = session.prompt("> Your Question: ")
        except (EOFError, KeyboardInterrupt):
            break
            
        if question.lower() in ['exit', 'quit']:
            break
            
        # 3. Process and Render
        with console.status("[bold yellow]Thinking...[/bold yellow]"):
            response = engine.query(question)
        
        console.print(Panel(Markdown(response), title="[bold magenta]AI Assistant[/bold magenta]"))
        input("\n[Press Enter to continue]")

if __name__ == "__main__":
    run_tui()