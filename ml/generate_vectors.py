import torch
from transformers import AutoTokenizer, AutoModel
import os

# Load pre-trained model
import argparse
import pandas as pd
import os
import torch
import transformers
import numpy as np
import json
import random

from datasets import load_dataset

from transformers import AutoTokenizer, BartForConditionalGeneration, pipeline, AutoModelForSeq2SeqLM
from torch.utils.data import Dataset

from matplotlib import pyplot as plt

random.seed(42)

class SimpleParagraphDataset(Dataset):
    def __init__(self, paragraphs):
        self.paragraphs = paragraphs

    def __len__(self):
        return len(self.paragraphs)

    def __getitem__(self, idx):
        return self.paragraphs[idx]

def read_by_paragraph(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        # Split the text file by empty lines to get paragraphs
        paragraphs = [para.strip() for para in f.read().split('\n') if para.strip()]
    return paragraphs


## summarization
n_summary = 25 # ideal number of summaries through the book
batch_size = 16

cache_dir = "/home/thomas/Work/Personal/literary_analysis"
os.environ["TRANSFORMERS_CACHE"] = cache_dir

classifier = pipeline(
    "zero-shot-classification", 
    model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli", 
    device=0,
    framework="pt",
    batch_size=batch_size
)

summarization_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn").to('cuda:0')
summarization_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

parser = argparse.ArgumentParser(description='Generate embeddings for paragraphs of text using a pre-trained transformer model.')
parser.add_argument('--model_name', default="meta-llama/Llama-2-7b-hf", type=str, required=False, help='Name of the pre-trained transformer model to use.')
parser.add_argument('--sentiment_dir', default="gutenberg/data/sentiment", type=str, required=False, help='Sentiment Analysis Dir.')
parser.add_argument('--input_dir', type=str, default='gutenberg/data/tokens', help='Path to the directory containing input text files.')
parser.add_argument('--chapters_dir', type=str, default='gutenberg/data/chapterlength', help='Path to the directory containing chapter length files.')
parser.add_argument('--output_dir', type=str, required=True, help='Path to the directory to save output embedding files.')
parser.add_argument('--metadata', default='gutenberg/metadata/metadata.csv', type=str, help='Path to the directory containing metadata files.')
parser.add_argument(
    'book_ids', 
    nargs='*', 
    help='List of Project Gutenberg book IDs (e.g., PG1001 PG10004 PG1003)'
)
args = parser.parse_args()

## compression classes
motif_explore = ['fear','oppression','hope','comfort','nostaligia']

os.makedirs(args.output_dir, exist_ok=True)
os.makedirs(args.sentiment_dir, exist_ok=True)

metadata = pd.read_csv(args.metadata)
# metadata_english = metadata[(metadata["language"] == "['en']") & (metadata['id'].isin(["PG100002","PG100003"]))]


# Your existing loop:
for english_id in args.book_ids:
    motif_locations = [ os.path.join(args.output_dir, f"{english_id}_{motif_term}.json") for motif_term in motif_explore ]
    motif_locationdict = dict(zip(motif_explore, motif_locations))
    motif_contents = { key: [] for key in motif_explore }

    filepath = os.path.join(args.input_dir, f"{english_id}_tokens.txt")
    chapterpath = os.path.join(args.chapters_dir, f"{english_id}_chapterlength.txt")
    embedding_path = os.path.join(args.output_dir, f"{english_id}_embeddings.txt")
    summary_path = os.path.join(args.output_dir, f"{english_id}_summary.json")

        # wipe the existing contents of the files
    for motif_location in motif_locations:
        with open(motif_location, 'w') as file:
            pass

    with open(summary_path, 'w') as file:
        pass

    if os.path.exists(filepath):
        # if not os.path.exists(embedding_path):
        # Load the text file by paragraphs (splitting by empty lines)
        paragraphs = read_by_paragraph(filepath)
        # dataset = SimpleParagraphDataset(paragraphs)
        # dataloader = DataLoader(dataset, batch_size=8, shuffle=False)  # Adjust batch_size based on GPU memory

        X = np.arange(len(paragraphs), dtype=np.int64)
        p = n_summary / len(paragraphs)
        # p = 1

        classification_results_all = []

        print(f"p: {p}")
        summarize_mask = np.random.rand(len(paragraphs)) < p
        paragraphs_to_summarize = [para for para, mask in zip(paragraphs, summarize_mask) if mask]

        summaries = []
        summaries_pox = []

        chapter_lengths = []
        with open(chapterpath, 'r') as f:
            chapter_lengths = [int(x) for x in f.read().split('\n') if x.strip()]

        # print(f"Chapter lengths: {chapter_lengths}")
        chapterlength_dict = { "x": list(range(len(chapter_lengths))), "y": chapter_lengths }
        with open(os.path.join(args.output_dir, f"{english_id}_chapterlength.json"), 'w') as f:
            json.dump(chapterlength_dict, f)

        # ## now to save the metadata
        # json_file_path = os.path.join(args.output_dir, f"{english_id}_info.json")
        # book_metadata = metadata[metadata['id'] == english_id]
        # book_values = book_metadata.iloc[0].to_dict() if not book_metadata.empty else None

        # if book_values is not None:
        #     book_info = {
        #         "title": book_values['title'],
        #         "author": book_values['author'],
        #         "author_birth": int(book_values['authoryearofbirth']),
        #         "author_death": int(book_values['authoryearofdeath'])
        #     }

        #     # Check if the JSON file exists
        #     if os.path.exists(json_file_path):
        #         # File exists, read it
        #         with open(json_file_path, 'r') as file:
        #             data = json.load(file)
        #         # Merge the new data
        #         data.update(book_info)
        #     else:
        #         # File does not exist, use new_data as the data
        #         data = book_info

        #     # Write the data to the J

        #     # Step 3: Write the updated dictionary back to the JSON file
        #     with open(json_file_path, 'w') as file:
        #         json.dump(data, file, indent=4)


        # Process paragraphs in batches for classification
        for i in range(0, len(paragraphs), batch_size):
            batch_paragraphs = paragraphs[i:i + batch_size]
            batch_classification_results = classifier(batch_paragraphs, motif_explore, multi_label=True)
            classification_results_all.extend(batch_classification_results)

        # print(classification_results)
        print(f"Classification results: {classification_results_all}")


        for classification_result in classification_results_all:
            for cx, label in enumerate(classification_result['labels']):
                score = classification_result['scores'][cx]
                motif_contents[label].append(score)

        # Prepare data for JSON dump
        for label in motif_contents.keys():
            data = {"x": list(range(len(motif_contents[label]))), "y": motif_contents[label]}
            with open(motif_locationdict[label], 'w') as file:
                json.dump(data, file)

        # Process in batches for summarization
        for i in range(0, len(paragraphs_to_summarize), batch_size):
            batch = paragraphs_to_summarize[i:i+batch_size]
            batch_indices = np.where(summarize_mask)[0][i:i+batch_size]  # Get the indices of paragraphs in the batch

            tokens_input = summarization_tokenizer.batch_encode_plus(
                ["summarize: " + p for p in batch],
                return_tensors='pt',
                max_length=1024,
                truncation=True,
                padding=True
            ).to('cuda:0')
            
            summary_ids = summarization_model.generate(
                input_ids=tokens_input['input_ids'],
                attention_mask=tokens_input['attention_mask'],
                min_length=40,
                max_length=80,
                no_repeat_ngram_size=3,
                num_beams=4,
                temperature=0.7,
                length_penalty=1.2
            )
            
            batch_summaries = [summarization_tokenizer.decode(g, skip_special_tokens=True) for g in summary_ids]
            
            # Store summaries and their positions
            summaries.extend(batch_summaries)
            summaries_pox.extend(batch_indices)


        # if random.random() < p:
        #     tokens_input = summarization_tokenizer.encode("summarize: "+paragraph, return_tensors='pt', max_length=512, truncation=True)
        #     summary_ids = summarization_model.generate(tokens_input, min_length=40, max_length=80)
        #     paragraph_summary = summarization_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        #     print(f"Summary at {c}: {paragraph_summary}.\n")
        #     print(f"Classification: {dict(zip(classification_results['labels'], classification_results['scores']))}\n")
        #     summaries_pox.append(c)
        #     summaries.append(paragraph_summary)

        summaries_pox = [ int(x) for x in summaries_pox ]
        summary_data = { "x": summaries_pox, "y": summaries }
        print(f"Summary data: {summary_data}")
        with open(summary_path, 'w') as f:
            json.dump(summary_data, f)
            # mean_embeddings = torch.cat([emb.mean(axis=0) for emb in embeddings], dim=0)

        # for c, motif_term in enumerate(motif_dictionary.keys()):
        #     data = {"x": X.tolist(), "y": motif_dictionary[motif_term] }
        #     motif_path = os.path.join(args.output_dir, f"{english_id}_{motif_term}.json")
        #     with open(motif_path, 'w') as f:
        #         json.dump(data, f)

        # np.savetxt(os.path.join(args.output_dir, f"{english_id}_embeddings.txt"), all_embeddings.numpy(), delimiter=",", fmt='%.9e')
        # np.savetxt(os.path.join(args.sentiment_dir, f"{english_id}_sentiment.txt"), sentiments.numpy(), delimiter=",", fmt='%.9e')

# ## Filter out the english books

# Define function to obtain embedding tensor for a paragraph of text
# def get_embedding(text):
#     input_ids = torch.tensor(tokenizer.encode(text)).unsqueeze(0)
#     with torch.no_grad():
#         outputs = pipeline(input_ids)
#         embedding = outputs.last_hidden_state.mean(dim=1).squeeze()
#     return embedding

# # Define function to save embedding tensor to a text file
# def save_embedding(embedding, filepath):
#     with open(filepath, "w") as f:
#         f.write(" ".join([str(x) for x in embedding.tolist()]))

# # Iterate over paragraphs of text, obtain embedding tensor, and save to text file
# if not os.path.exists(args.output_dir):
#     os.makedirs(args.output_dir)
# for i, filename in enumerate(os.listdir(args.input_dir)):
#     filepath = os.path.join(args.input_dir, filename)
#     with open(filepath, "r") as f:
#         text = f.read()
#     embedding = get_embedding(text)
#     output_filepath = os.path.join(args.output_dir, f"embedding_{i}.txt")
#     save_embedding(embedding, output_filepath)
