#!/usr/bin/env node
/* © Copyright 2024, Simon Slater

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 2 of the License.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

const express = require('express');
const https = require('https');
const app = express();
const path = require('path');
const fs = require('fs');

var signbsl = require("./signbsl-to-anki");

// Serve static files from the these directories.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media',express.static(path.join(__dirname, 'media')));
app.use('/decks',express.static(path.join(__dirname, 'decks')));


// Parse JSON bodies for POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Route to handle form submission
app.post('/submit', (req, res) => {
    const { text_input } = req.body;

    // Download all videos and words.
    all_videos_and_words = signbsl.scrape_signbsl(text_input.split(" "));

    // Send a response back to the client.
    res.json( all_videos_and_words );
});


app.post('/submit_users_selected_videos', (req, res) => {
    const { user_selected_videos } = req.body;
    const id = user_selected_videos[0];
    const chosen_videos = user_selected_videos[1];

    // Make the deck.
    const anki_deck_url = signbsl.make_flashcards( id, chosen_videos );

    // Send the deck back to client.
    res.json( anki_deck_url );
});

app.post('/submit_get_last_generated_deck', (req, res) => {
    let last_generated_deck = signbsl.get_last_generated_deck( "/decks/", as_text_file = false );

    // Send the deck back to client.
    res.json( last_generated_deck );
});

app.post('/submit_get_word_count', (req, res) => {
    var word_count = 0;
    var flashcard_count = 0;
    let last_generated_deck = signbsl.get_last_generated_deck( "/decks/", as_text_file = true );

    if( last_generated_deck != null ) {
        const all_db_lines = fs.readFileSync( last_generated_deck, 'UTF8' );
        var previous_word = "";

        for( const line of all_db_lines.split("\n") ) {
            const flashcard = signbsl.Flashcard.fromDBLine( line );
            if( flashcard != null ) {
                flashcard_count++;
                // Make sure we don't count words with a "<br>" tag, because they are the ones with the video count.
                if( ( flashcard.word.toLowerCase() != previous_word.toLowerCase() )  &  (flashcard.word.match("<br>") == null)  ) {
                    word_count++;
                    previous_word = flashcard.word;
                }
            }
        }
    }

    console.log("Word count is: " + word_count );
    console.log("Flashcard count is: " + flashcard_count );
    // Send the deck back to client.
    res.json( [ word_count, flashcard_count ] );
});
// Load SSL certificate and key
const options = {
    key: fs.readFileSync('privkey.pem'),
    cert: fs.readFileSync('fullchain.pem')
};

// Create HTTPS server
const PORT = 8190
https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}/bsl/`);
});

