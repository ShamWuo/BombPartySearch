async function findWords() {
  const input = document.getElementById("Input").value.toLowerCase();
  const resultList = document.getElementById("resultList");
  const filter = parseInt(document.getElementById("lengthFilter").value);
  resultList.innerHTML = "";

  if (!input) return;

  const response = await fetch(`https://api.datamuse.com/words?sp=*${input}*`);
  const data = await response.json();

  let words = data.map(item => item.word);
  words.sort((a, b) => a.length - b.length);

  if (filter > 0) {
    words = words.filter(word => word.length === filter);
  }

  if (words.length === 0) {
    resultList.innerHTML = "<li>too bad.....</li>";
    return;
  }

  for (const word of words) {
    const li = document.createElement("li");
    li.textContent = word;
    resultList.appendChild(li);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    findWords();
  }
});
