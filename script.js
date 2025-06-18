// Check whether app is runing or not
console.log("App is running");

// array to store all article summaries
let summaryList = [];

// function to fetch articles from RSS feed
async function fetchArticles() {
  // get topic input value and trim all the whitespaces from them
  const topicInput = document.getElementById("topicInput").value.trim();
  // if there is no topic input, show alert
  if (!topicInput) {
    alert("Please enter one or more topics.");
    return;
  }
  // encode topic for use in urls
  const topicEncoded = encodeURIComponent(topicInput);
  // using proxy all origins to bypass CORS restrictions and get RS feed
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/search.rss?q=${topicEncoded}`)}`;

  // display while loading
  const outputDiv = document.getElementById("summaryOutput");
  outputDiv.innerHTML = "<p>Loading articles...</p>";

  try {
    // fetch RSS feed, if not ok, throw below error
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to fetch RSS feed");
    
    // read response as plain tetx
    const rssText = await response.text();

    // PInitializing DOMParser and parsing RSS XML into DOM document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");

    // console for debugging -- added while running the code
    console.log("Fetched raw RSS text:\n", rssText);         // View entire RSS text (XML string)
    console.log("Parsed XML Document:", xmlDoc);             // Parsed DOM object
    console.log("Number of <item> elements:", xmlDoc.getElementsByTagName("item").length);  // Count of articles

    // getting all articles - changed "item" to "entry" as later figured out that in feed url, each item tag is actually entry tag
    const items = xmlDoc.getElementsByTagName("entry");

    // again debugging to check how many articles fetched
    console.log("Number of <item> elements:", items.length);

    // checking if no items
    if (items.length === 0) throw new Error("No articles found for this topic.");

    outputDiv.innerHTML = `<h3>Top Reddit News for "${topicInput}":</h3>`;
    
    // limiting upto 5 artciels to shorten the time
    for (let i = 0; i < Math.min(items.length, 5); i++) {
        try {
            // extract link and title 
            const title = items[i].getElementsByTagName("title")[0]?.textContent || "No title";
            const link = items[i].getElementsByTagName("link")[0]?.getAttribute("href") || "#";

            // creating paragraph, settign html content and artocle to page
            const articleEl = document.createElement("p");
            articleEl.innerHTML = `<strong>${i + 1}.</strong> <a href="${link}" target="_blank">${title}</a>`;
            outputDiv.appendChild(articleEl);

            // Adding loading message for summary
            const summaryEl = document.createElement("p");
            summaryEl.style.fontStyle = "italic";
            summaryEl.textContent = "Summarizing article...";
            outputDiv.appendChild(summaryEl);

            // ceating dummy full text since Reddit doesn't have actual article content
            const dummyArticleText = `${title} - This is a simulated full article content for testing summarization.`;

            try {
                // call summarizarion function
                const summary = await summarizeText(dummyArticleText);
                summaryEl.textContent = `📝 Summary: ${summary}`;
                // adding summary to list
                summaryList.push(summary); 
            } catch (err) {
                // error message if fail
                summaryEl.textContent = "Summary could not be generated.";
            }
        } catch (err) {
            // error for parsing and checking 
            console.warn(`Failed to parse article ${i + 1}:`, err);
            const fallbackEl = document.createElement("p");
            fallbackEl.innerHTML = `<strong>${i + 1}.</strong> <em>Unable to load this article.</em>`;
            outputDiv.appendChild(fallbackEl);
        }

    }

    // placeholder for generating summary
    const finalSummaryDiv = document.getElementById("finalSummary");
    finalSummaryDiv.innerHTML = "<p><em>Generating consolidated summary...</em></p>";
    
    // combining summaries
    const combinedText = summaryList.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
    const combinedSummary = await summarizeText(`Combine and summarize the following article summaries into one concise paragraph:\n\n${combinedText}`);
    
    //display simmary
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
        // checking for api key entry
        console.warn("No Hugging Face API key provided.");
        return "No API key provided. Please enter your Hugging Face key.";
    }
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userApiKey}`
                // passing as bearer token
            },
            body: JSON.stringify({ inputs: text.slice(0, 1024) }) 
            // as Hugging Face limits to 1024 vcharacters, so done slicing
        });
        const result = await response.json();
        // checking for hf result
        console.log("Hugging Face response:", result)
        
        // Handling if error occurs
        if (result.error || !Array.isArray(result) || !result[0]?.summary_text) {
            return "Summary not available.";
        }
        
        return result[0].summary_text;
    } catch (err) {
        console.error("Error from summarization API:", err);
        return "Summary not available.";
    }
}

// when user clicks generate summary buttpon, call fetch article  function
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
  // create blob of summary content
  const blob = new Blob([summaryText], { type: "text/plain" });
  //create temperory url for blob
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

  // subject and body - pre filling  and open in new tab
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
  window.open(gmailLink, "_blank");
});
