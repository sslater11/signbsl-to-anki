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
cd src; ./server-signbsl-to-anki.js
* Connect to your server on port 3000.
* Type in a word,
* Click "Find Signs".
* Select videos.
* Click "Create Anki Deck".
* Save the generated deck to your device.
* Open Anki or AnkiDroid.
* File > Import on PC  -- or -- On Android, tap the three lines in top right > Import.


# Nginx setup
This server should be ran on the subpath /bsl. e.g. example.com/bsl/
For data to be passed properly, we need to route each request to the proper place.
Place this underneath the server_name line.
I think the sub path location needs to go before the root path, so have the root location at the bottom of this section.
```
        # Signbsl Server
        location /bsl/decks {
                proxy_pass https://localhost:8190/decks;
        }

        location /bsl/submit_get_word_count {
                proxy_pass https://localhost:8190/submit_get_word_count;
        }

        location /bsl/submit_get_last_generated_deck {
                proxy_pass https://localhost:8190/submit_get_last_generated_deck;
        }

        location /bsl/submit_users_selected_videos {
                proxy_pass https://localhost:8190/submit_users_selected_videos;
        }

        location /bsl/submit {
                proxy_pass https://localhost:8190/submit;
        }

        location /bsl {
                proxy_pass https://localhost:8190/;
        }
```
