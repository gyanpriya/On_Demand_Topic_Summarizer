# On-Demand Topic Summarizer

A static Single-Page Application (SPA) that lets users:
- Input any topic(s)
- Fetch latest Reddit articles via RSS
- Summarize each article using Hugging Face's `facebook/bart-large-cnn` model
- Generate one consolidated summary of all articles
- Download or email the final compiled summary

Hosted using GitHub Pages and requires no server or backend setup.

---

## Setup Instructions

1. **Clone this repo** or 
2. Open `index.html` in your browser **or**
3. Visit the "https://gyanpriya.github.io/On_Demand_Topic_Summarizer/"
4. Enter a topic (or multiple topics separated by commas) and your **Hugging Face API key** to start summarizing.

> **Note**: The app does not store your Hugging Face key and runs entirely in your browser.

---

## Usage Guide

1. Enter one or more topics in the text box.
2. Paste your **Hugging Face API Key** (you can get one [here](https://huggingface.co/settings/tokens)).
3. Click `Generate Summary`.
4. View the top 5 articles + summaries, and one consolidated summary.
5. Use buttons to:
   - **Download** summary as `.txt`
   - **Email** summary via Gmail

---

## AI Usage

### Model Used
- `facebook/bart-large-cnn`

### Inference Endpoint
- Hugging Face Hosted Inference API:  
  `https://api-inference.huggingface.co/models/facebook/bart-large-cnn`

---

## Tools & Libraries Used

- Vanilla JavaScript (no frameworks)
- HTML5 / CSS3
- [Hugging Face](https://huggingface.co) free-tier API
- [Reddit RSS](https://www.reddit.com/wiki/rss/)
- [AllOrigins CORS Proxy](https://allorigins.win/) (no server required)
- GitHub Pages (for hosting)

---

## Prompts Log

### Prompt Template Used for Individual Articles:

```json
{
  "inputs": "[Article Title] - This is a simulated full article content for testing summarization."
}
