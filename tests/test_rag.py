import pytest
from unittest.mock import MagicMock, patch
from src.rag_engine import PDFInsightsEngine

@pytest.fixture
def mock_engine():
    # We create the engine here. We don't patch in the fixture 
    # to avoid the scope-leak issue.
    return PDFInsightsEngine(db_path="./test_db")

# Use decorators to ensure the patches are active for the whole test
@patch('src.rag_engine.ollama.Client')
@patch('src.rag_engine.Chroma')
@patch('src.rag_engine.OllamaEmbeddings')
def test_query_returns_string(mock_embeddings, mock_chroma, mock_client_class, mock_engine):
    """
    Ensure the query method returns a string by patching the Client and Chroma instances.
    """
    # 1. Arrange: Setup the mock client
    mock_client = MagicMock()
    mock_client.chat.return_value = {
        'message': {'content': 'The objective is to analyze documents.'}
    }
    mock_client_class.return_value = mock_client

    # 2. Arrange: Setup the mock Chroma instance (the db object)
    mock_db = MagicMock()
    mock_db.similarity_search.return_value = [] # Return empty list to simulate no matches
    mock_chroma.return_value = mock_db

    # 3. Act: Query the engine
    result = mock_engine.query("What is the objective?")
    
    # 4. Assert
    assert isinstance(result, str)
    assert "objective" in result.lower()
    mock_client.chat.assert_called_once()

def test_initialization_sets_paths(mock_engine):
    """
    Verify the class initializes with the correct paths.
    """
    assert mock_engine.db_path == "./test_db"
    assert mock_engine.model_name == "llama3"