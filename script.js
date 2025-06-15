console.log("App is running");

let summaryList = [];

async function fetchArticles() {
  //let finalSummaryText = ""; // Global summary collector
  const topicInput = document.getElementById("topicInput").value.trim();

  if (!topicInput) {
    alert("Please enter one or more topics.");
    return;
  }

  const topicEncoded = encodeURIComponent(topicInput);
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/search.rss?q=${topicEncoded}`)}`;

  const outputDiv = document.getElementById("summaryOutput");
  outputDiv.innerHTML = "<p>Loading articles...</p>";

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to fetch RSS feed");

    const rssText = await response.text();

    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");

    // DEBUGGING: Inspect what we got
    console.log("Fetched raw RSS text:\n", rssText);         // View entire RSS text (XML string)
    console.log("Parsed XML Document:", xmlDoc);             // Parsed DOM object
    console.log("Number of <item> elements:", xmlDoc.getElementsByTagName("item").length);  // Count of articles

    // get article
    const items = xmlDoc.getElementsByTagName("entry");

    // debug
    console.log("Number of <item> elements:", items.length);

    if (items.length === 0) throw new Error("No articles found for this topic.");

    // Clear output and display up to 5 articles
    outputDiv.innerHTML = `<h3>Top Reddit News for "${topicInput}":</h3>`;
    
    for (let i = 0; i < Math.min(items.length, 5); i++) {
        try {
            const title = items[i].getElementsByTagName("title")[0]?.textContent || "No title";
            const link = items[i].getElementsByTagName("link")[0]?.getAttribute("href") || "#";

            const articleEl = document.createElement("p");
            articleEl.innerHTML = `<strong>${i + 1}.</strong> <a href="${link}" target="_blank">${title}</a>`;
            outputDiv.appendChild(articleEl);

            // Add loading message for summary
            const summaryEl = document.createElement("p");
            summaryEl.style.fontStyle = "italic";
            summaryEl.textContent = "Summarizing article...";
            outputDiv.appendChild(summaryEl);

            // Simulated full text since Reddit doesn't have actual article content
            const dummyArticleText = `${title} - This is a simulated full article content for testing summarization.`;

            try {
                const summary = await summarizeText(dummyArticleText);
                summaryEl.textContent = `📝 Summary: ${summary}`;
                summaryList.push(summary); // collect for final summarization
                //finalSummaryText += `${i + 1}. ${title}\nSummary: ${summary}\n\n`;
            } catch (err) {
                summaryEl.textContent = "Summary could not be generated.";
            }
        } catch (err) {
            console.warn(`Failed to parse article ${i + 1}:`, err);
            const fallbackEl = document.createElement("p");
            fallbackEl.innerHTML = `<strong>${i + 1}.</strong> <em>Unable to load this article.</em>`;
            outputDiv.appendChild(fallbackEl);
        }

    }

    const finalSummaryDiv = document.getElementById("finalSummary");
    finalSummaryDiv.innerHTML = "<p><em>Generating consolidated summary...</em></p>";
    
    const combinedText = summaryList.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
    const combinedSummary = await summarizeText(`Combine and summarize the following article summaries into one concise paragraph:\n\n${combinedText}`);
    
    finalSummaryDiv.innerHTML = `<h3>🧠 Consolidated Summary:</h3><p>${combinedSummary}</p>`;


    // Show download/email buttons if hidden
    document.getElementById("downloadBtn").style.display = "inline-block";
    document.getElementById("emailBtn").style.display = "inline-block";

  } catch (err) {
    outputDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// Hugging Face summarizer
async function summarizeText(text) {
    const endpoint = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
    const userApiKey = document.getElementById("apiKeyInput").value.trim();
    if (!userApiKey) {
        console.warn("No Hugging Face API key provided.");
        return "No API key provided. Please enter your Hugging Face key.";
    }
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userApiKey}`
            },
            body: JSON.stringify({ inputs: text.slice(0, 1024) }) // Hugging Face input limit
        });
        const result = await response.json();
        console.log("Hugging Face response:", result)
        
        // Handle potential errors in response
        if (result.error || !Array.isArray(result) || !result[0]?.summary_text) {
            return "Summary not available.";
        }
        
        return result[0].summary_text;
    } catch (err) {
        console.error("Error from summarization API:", err);
        return "Summary not available.";
    }
}

document.getElementById("fetchBtn").addEventListener("click", fetchArticles);

// Function to collect current summary content from the page
function getSummaryText() {
  const outputDiv = document.getElementById("summaryOutput");
  const finalDiv = document.getElementById("finalSummary");
  const paragraphs = [...outputDiv.querySelectorAll("p, h3"), ...finalDiv.querySelectorAll("p, h3")];
  let text = "";
  paragraphs.forEach(p => {
    text += p.innerText + "\n\n";
  });
  return text.trim();
}

// DOWNLOAD FUNCTION
document.getElementById("downloadBtn").addEventListener("click", () => {
  const summaryText = getSummaryText();
  const blob = new Blob([summaryText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "summary.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// EMAIL FUNCTION
document.getElementById("emailBtn").addEventListener("click", () => {
  const summaryText = getSummaryText();
  const subject = encodeURIComponent("Topic Summary from Summarizer App");
  const body = encodeURIComponent(summaryText);

  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
  window.open(gmailLink, "_blank");
});
