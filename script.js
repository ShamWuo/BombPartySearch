async function findWords() {
  const input = document.getElementById("Input").value.toLowerCase();
  const resultList = document.getElementById("resultList");
  const filter = parseInt(document.getElementById("lengthFilter").value);
  resultList.innerHTML = "";
  const loading = document.getElementById("loading");
  loading.classList.remove("hidden");

  if (!input) {
    loading.classList.add("hidden");
    return;
  }

  try {
    const response = await fetch(`https://api.datamuse.com/words?sp=*${input}*`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();

    let words = data.map(item => item.word);
    words.sort((a, b) => a.length - b.length);

    if (filter > 0) {
      words = words.filter(word => word.length === filter);
    }

    if (words.length === 0) {
      resultList.innerHTML = "<li>No words found.</li>";
      loading.classList.add("hidden");
      return;
    }

    for (const word of words) {
      const li = document.createElement("li");
      li.textContent = word;
      li.onclick = () => copyToClipboard(word);
      resultList.appendChild(li);
    }
  } catch (error) {
    resultList.innerHTML = "<li>Error fetching words.</li>";
  } finally {
    loading.classList.add("hidden");
  }


  window.wordsList = words;
}

function copyToClipboard(word) {
  navigator.clipboard.writeText(word).then(() => {
    alert(`Copied to clipboard: ${word}`);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    findWords();
  } 
});
