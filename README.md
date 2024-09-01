# A British Sign Language Anki Flashcard Creator :)

This is a node server which scrapes videos from SignBSL.com and generates an anki flashcard deck using the found videos.

The user will type in a word and this will generate an anki deck for the searched words.

A master deck will also be created which contains all the words that have been searched, so the user doesn't have to constantly import the generated anki deck, they can update it whenever they care to.

# Dependencies
* node
* express
* genanki


# Install
* npm install express
* pip3 install genanki --break-system-packages

# Usage
node src/signbsl-to-anki-server.js
* Connect to your server on port 3000.
* Type in a word,
* Click "Find Signs".
* Select videos.
* Click "Create Anki Deck".
* Save the generated deck to your device.
* Open Anki or AnkiDroid.
* File > Import on PC  -- or -- On Android, tap the three lines in top right > Import.

