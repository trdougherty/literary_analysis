
# [Storyline Structure Analysis](https://www.storylinestructure.com/) - https://www.storylinestructure.com/

## Project Overview
Storyline Structure Analysis is a project that visualizes the progression of complex concepts through the course of a book. Utilizing advanced Natural Language Processing techniques, it identifies and plots the ebbs and flows of themes like fear, hope, and oppression in literary works.

## Technical Overview
The project leverages the power of large language models, particularly Facebook's BART and DeBERTa, to read and interpret books. Key functionalities include sentiment analysis, summarization, and chapter-based text processing.

## Installation

### Requirements
- Python 3.x
- PyTorch
- Transformers library
- NumPy
- Pandas

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/storyline-structure-analysis.git
   cd storyline-structure-analysis
   ```

2. Install dependencies:
   ```bash
   conda create --name lit --file requirements.txt
   ```

## Usage

### Command-Line Interface
To run the analysis, use the following command with appropriate arguments:

```bash
python ml/generate_vectors.py --input_dir gutenberg/data/tokens/ --output_dir public/data/ PG1399
```

To build the server locally, you can use

```bash
node server.js
```

### Key Components

- **Zero-Shot Classification**: Utilizes `MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli` model for classifying paragraphs against a set of predefined motifs.

- **Summarization**: Employs `facebook/bart-large-cnn` for generating concise summaries of selected paragraphs.

- **Custom Scripts**: Includes scripts for processing books, tokenizing text, and organizing data for visualization.

## Data Processing
The project reads books by paragraph, classifies them according to specified motifs, and generates summaries for a subset of paragraphs. Summarization and classification results are stored in JSON format for visualization.

### Example JSON Structure
```json
{
  "x": [0, 1, 2, ...],
  "y": [0.1, 0.5, 0.2, ...]
}
```

## Visualization
Data visualization is implemented using D3.js, which plots the progression of concepts throughout a book. This is accompanied by an interactive web interface.

## Contributing
Contributions to the project are welcome. Please read the contributing guidelines before submitting your pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- [Facebook AI Research](https://ai.facebook.com/) for the BART model
- [Moritz Laurer](https://huggingface.co/MoritzLaurer) for the DeBERTa-v3-base-mnli-fever-anli model
- [Project Gutenberg](https://www.gutenberg.org/) for providing a vast collection of books

---

Created by: [Thomas Ryun Dougherty](https://www.linkedin.com/in/thomasryundougherty/)
© MIT License
