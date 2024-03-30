// Replace 'your-api-key' with your actual API key
const dictapiKey = '4af8c169-d5a9-4dbc-8db7-e1e94b91c5eb';
const thesapiKey = 'f0bbde94-db27-4ccf-b405-2a9be1a7acfc'

// Function to fetch data for a given word and log its ID

class UnknownWordError extends Error {
  constructor(word) {
    super(`The word "${word}" is not found.`);
    this.name = 'UnknownWordError';
  }
}

class SpellingError extends Error {
  constructor(word) {
    super('There is a spelling error.');
    this.name = 'SpellingError';
  }
}

class NoSynError extends Error {
  constructor(word){
    super(`"${word}" has no synonym and antonym.`);
    this.name = 'NoSynError';
  }
}

function isStringArray(arr) {
  // Check if arr is an array
  if (!Array.isArray(arr)) {
    return false;
  }

  // Iterate through each element in the array
  for (let i = 0; i < arr.length; i++) {
    // Check if the type of the element is not a string
    if (typeof arr[i] !== 'string') {
      return false;
    }
  }

  // If all elements are strings, return true
  return true;
}

function spellcheck(word) {
  const apiUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictapiKey}`;
  const heading = document.getElementById("wordheading");
  const down = document.getElementById("definition");

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      heading.innerHTML = " ";
      down.innerHTML = " ";

      // 1. create division: did you mean ${word}
      var mostLikely = document.createElement("div");
      var nearestDef = document.createElement("p");
      nearestDef.textContent = 'Did you mean: ';

      // 2. create clickable word
      var clickableWord = document.createElement("a");
      clickableWord.href = "#";  // You can set the href to "#" or any valid URL
      clickableWord.textContent = data[0];

      // 3. create heading: you might also mean:
      var otherPossibilities = document.createElement("div");
      var otherDefs = document.createElement("p");
      otherDefs.textContent = 'You might also mean:';
      otherPossibilities.appendChild(otherDefs);

      nearestDef.appendChild(clickableWord);
      mostLikely.appendChild(nearestDef);
      heading.appendChild(mostLikely);

      // 4. list words adjacent to each other
      var index = 1;
      var others = [];
      while (index < 5) {
        if (data.length === index) {
          break;
        } else {
          // Create a new clickableWord for each iteration
          var otherClickableWord = document.createElement("a");
          otherClickableWord.href = "#";
          otherClickableWord.textContent = data[index];

          // Add event listener to the new clickableWord
          otherClickableWord.addEventListener("click", createClickListener(data[index]));

          // Push the new clickableWord to the others array
          others.push(otherClickableWord);
          others.push(' ');

          index++;
        }
      }
      otherPossibilities.append(...others);
      down.appendChild(otherPossibilities);

      // 5. add event listener: if click -> activate dictionary function
      clickableWord.addEventListener("click", function (event) {
        var dict = document.getElementById("dictionary");
        var thes = document.getElementById("thesaurus");
        event.preventDefault();  // Prevent the default behavior of the anchor element
        if (dict.disabled === true) {
          dictionary(data[0]);
        }
        else if (thes.disabled === true) {
          thesaurus(data[0]);
        }
        heading.innerHTML = word;
        var searchInput = document.getElementById("Search");
        searchInput.value = data[0];
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
    });

  // Create a closure for the event listener to capture the current value of word
  function createClickListener(clickedWord) {
    return function (event) {
      event.preventDefault();
      dictionary(clickedWord);
    };
  }
}

function dictionary(word) {
  const apiUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictapiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Extracting the "id" from the JSON response
      wordheading.innerHTML = word;
      console.log(data);
      //if unknown word, data is array of possible words it could be
      //else, data is array of all possible definitions

      if (isStringArray(data)) {
        if (data.length === 0) {
          throw new UnknownWordError(word);
        }
        else {
          throw new SpellingError(word);
        }
      }

      const definitions = [];
      for (let i = 0; i < data.length; i++) {
        let a = 0;
        const fl = data[i].fl;
        if (definitions.some(def => def[0] === fl)) {
          a = definitions.findIndex(def => def[0] === fl);
        }
        else {
          a = definitions.length;
          definitions.push([fl]);
        }
        const shortDefs = data[i].shortdef;
        definitions[a].push(...shortDefs);
      }
      definition.innerHTML = definitions;
      console.log(definitions);
      displayDefinitions(definitions);
    })
    .catch(error => {
      // Handle the custom exception
      if (error instanceof UnknownWordError) {
        console.error(`Error: ${error.message}`);
        wordheading.innerHTML = word;
        definition.innerHTML = `${error.message}`;
        // Additional handling for unknown words if needed
      }
      else if (error instanceof SpellingError) {
        console.error(`Error : ${error.message}`);
        spellcheck(word);
      }
      else {
        console.error("Error fetching data:", error);
      }
    });
}

function displayDefinitions(definitions) {
  const defDisplay = document.getElementById("definition");
  defDisplay.innerHTML = "";

  for (const entry of definitions) {
    var newDef = document.createElement("div");
    //const partOfSpeech = entry[0];
    //const shortDefs = entry.slice(1);
    var partOfSpeech = document.createElement("p");
    partOfSpeech.textContent = entry[0] + ':';
    newDef.appendChild(partOfSpeech);
    partOfSpeech.classList.add("part-of-speech");
    defDisplay.appendChild(newDef);

    var defs = document.createElement("div");
    const shortDefs = entry.slice(1);

    for (let i = 0; i < shortDefs.length; i++) {
      var defPart = document.createElement("p");
      defPart.textContent = i + 1 + '.' + ' ' + shortDefs[i];
      defs.appendChild(defPart);
    }

    defs.classList.add("def-display");
    newDef.appendChild(defs);
  }
}

function thesaurus(word) {
  const apiUrl = `https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${thesapiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(async data => {
      console.log(data);
      if (isStringArray(data)) {
        if (data.length === 0) {
          throw new UnknownWordError(word);
        }
        else {
          const found = await checkInDictionary(word);
          console.log(found);
          if (found === true){
            throw new NoSynError(word);
          }
          else{
            throw new SpellingError(word);
          }
        }
      }

      const wordEntries = [];

      for (let i = 0; i < data.length; i++) {
        const shortdef = data[i].shortdef;
        const synonyms = data[i].meta.syns;  // Updated to correctly access synonyms
        const antonyms = data[i].meta.ants;  // Updated to correctly access antonyms
        for (let j = 0; j < shortdef.length; j++) {
          const entry = {
            meaning: shortdef[j],
            synonyms: synonyms[j] || [],  // Ensure that synonyms is an array or default to an empty array
            antonyms: antonyms[j] || [],  // Ensure that antonyms is an array or default to an empty array
          };
          wordEntries.push(entry);
        }
      }
      console.log(wordEntries);
      wordheading.innerHTML = word;
      thesaurusDisplay(wordEntries);
    })
    .catch(error => {
      // Handle the custom exception
      if (error instanceof UnknownWordError) {
        console.error(`Error: ${error.message}`);
        wordheading.innerHTML = word;
        definition.innerHTML = `${error.message}`;
        // Additional handling for unknown words if needed
      }
      else if (error instanceof SpellingError) {
        console.error(`Error : ${error.message}`);
        spellcheck(word);
      }
      else if (error instanceof NoSynError) {
        console.error(`Error: ${error.message}`);
        wordheading.innerHTML = `${error.message}`;
        definition.innerHTML = " ";
      }
      else {
        console.error("Error fetching data:", error);
      }
    });
}

function checkInDictionary(word) {
  const dictApiUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictapiKey}`;

  return fetch(dictApiUrl)
    .then(response => response.json())
    .then(data => {
      if (isStringArray(data)) {
        return false;
      } 
      else {
        return true;
      }
    })
    .catch(error => {
      // Handle the error (optional)
      console.error("Error fetching dictionary data:", error);
      return false; // Return false in case of an error
    });
}

function thesaurusDisplay(wordEntries) {
  const defDisplay = document.getElementById("definition");
  defDisplay.innerHTML = "";
  for (const entry of wordEntries) {
    // 1. create division
    var thes = document.createElement("div");
    // 2. create section
    var heading = document.createElement("section");
    // 3. create heading
    var headingTitle = document.createElement("h3");
    headingTitle.id = "meaning";
    headingTitle.textContent = entry.meaning;
    // 4. create another division for display
    var display = document.createElement("div");
    // 5. create division for buttons
    var buttons = document.createElement("div");
    buttons.id = "buttons";
    // 6. create buttons
    var synButton = document.createElement("button");
    synButton.id = "syn";
    synButton.textContent = "Synonyms";
    var antButton = document.createElement("button");
    antButton.id = "ant";
    antButton.textContent = "Antonyms";
    // 7. Create a division for displaying synonyms and antonyms
    var synonymsAndAntonymsDisplay = document.createElement("div");
    synonymsAndAntonymsDisplay.id = "display";
    synButton.disabled = true;
    antButton.disabled = false;
    // call on function of synButton
    displaySyns(entry, synonymsAndAntonymsDisplay);
    //8. append everything respectively
    //a. add buttons to button divs
    buttons.appendChild(synButton);
    buttons.appendChild(antButton);
    //b. add button div to main display
    display.appendChild(buttons);
    //c. add main div to section
    heading.appendChild(headingTitle);
    //d. add section to full divison
    thes.appendChild(heading);
    thes.appendChild(display);
    thes.appendChild(synonymsAndAntonymsDisplay);
    //e. add div to class
    thes.classList.add("thesDisplay");
    //f. add div to display
    defDisplay.appendChild(thes);
    //g. add toggling function 
    thesToggle(synButton, antButton, entry, synonymsAndAntonymsDisplay);
  }
}

function displaySyns(entry, display) {
  display.innerHTML = " ";
  for (const word of entry.synonyms) {
    var clickableWord = document.createElement("a");
    clickableWord.href = "#";
    clickableWord.textContent = word;
    display.appendChild(clickableWord);
    display.appendChild(document.createTextNode(" "));
    clickableWord.addEventListener("click", function (event) {
      event.preventDefault();
      thesaurus(word);
    });
  }
}

function displayAyns(entry, display) {
  display.innerHTML = " ";

  if (entry.antonyms.length === 0) {
    var none = document.createElement("p");
    none.textContent = "No antonyms";
    display.appendChild(none);
  } else {
    for (const word of entry.antonyms) {
      var clickableWord = document.createElement("a");
      clickableWord.href = "#";
      clickableWord.textContent = word;
      display.appendChild(clickableWord);
      display.appendChild(document.createTextNode(" "));
      clickableWord.addEventListener("click", function (event) {
        event.preventDefault();
        thesaurus(word);
      });
    }
  }
}

// function used to allow enter key to be used 
Search.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    press.click();
  }
})

var prev;
//function to activate the respective functions according to buttons
press.addEventListener("click", (e) => {
  e.preventDefault();
  var dict = document.getElementById('dictionary');
  var thes = document.getElementById('thesaurus');
  const defDisplay = document.getElementById("definition");
  var searchInput = document.getElementById('Search');
  prev = searchInput.value;

  if (dict.disabled === true) {
    dictionary(Search.value);
  }

  else if (thes.disabled === true) {
    thesaurus(Search.value);
  }

  else {
    wordheading.innerHTML = "Select a function";
    defDisplay.innerHTML = " ";
  }

  console.log(prev);
})

//function used to toggle bwtn buttons
// function toggle(btn) {
//   var dict = document.getElementById('dictionary');
//   var thes = document.getElementById('thesaurus');
//   var searchInput = document.getElementById('Search');

//   dict.addEventListener("click", function () {
//     dict.disabled = true;
//     thes.disabled = false;
//     if (prev === searchInput.value){
//       dictionary(searchInput.value);
//     }
//   });

//   thes.addEventListener("click", function () {
//     dict.disabled = false;
//     thes.disabled = true;
//     if (prev === searchInput.value){
//       thesaurus(searchInput.value);
//     }
//   });
// }

// Assuming you have these elements in your HTML:
var dict = document.getElementById('dictionary');
var thes = document.getElementById('thesaurus');
var searchInput = document.getElementById('Search');

// Add a single event listener for both dictionary and thesaurus buttons
document.addEventListener("click", function (event) {
  if (event.target === dict) {
    dict.disabled = true;
    thes.disabled = false;
    if (prev === searchInput.value) {
      dictionary(searchInput.value);
    }
  } else if (event.target === thes) {
    dict.disabled = false;
    thes.disabled = true;
    if (prev === searchInput.value) {
      thesaurus(searchInput.value);
    }
  }
});

//function used to toggle between buttons
function toggle(btn) {
  if (btn === 'dictionary') {
    dict.click(); // Simulate a click to trigger the event listener
  } else if (btn === 'thesaurus') {
    thes.click(); // Simulate a click to trigger the event listener
  }
}

function thesToggle(synButton, antButton, entry, display) {
  synButton.addEventListener("click", function () {
    synButton.disabled = true;
    antButton.disabled = false;
    displaySyns(entry, display);
  });

  antButton.addEventListener("click", function () {
    synButton.disabled = false;
    antButton.disabled = true;
    displayAyns(entry, display);
  });
}

