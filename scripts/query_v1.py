import sys
import os
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.markdown import Markdown

# Ensure root pathing
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src import PDFInsightsEngine

console = Console()

def run_tui():
    console.clear()
    console.print(Panel("[bold blue]Local RAG Orchestrator[/bold blue]\nType 'exit' to quit.", expand=False))
    
    engine = PDFInsightsEngine()
    
    while True:
        # Prompt user with styling
        question = Prompt.ask("\n[bold green]?[/bold green] [bold]Your Question[/bold]")
        
        if question.lower() in ['exit', 'quit']:
            console.print("[bold red]Goodbye![/bold red]")
            break
            
        with console.status("[bold yellow]Thinking...[/bold yellow]", spinner="dots"):
            response = engine.query(question)
        
        # Render the response in a panel
        console.print(Panel(
            Markdown(response), 
            title="[bold magenta]AI Assistant[/bold magenta]", 
            border_style="magenta"
        ))

if __name__ == "__main__":
    run_tui()