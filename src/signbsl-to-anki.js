#!/usr/bin/env node
/* © Copyright 2024, Simon Slater

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 2 of the License.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
*/


const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');
const { execSync } = require('child_process');
const crypto = require('crypto');

const IS_SIMULATE_MODE = false;

/* TODO:
    test whether filenames with quotes and brackets break this script and the genanki script.
    make this parse the string of words so that we can send a string like "cheese beef ham" and it will make flashcards for all 3 words.
*/



class Flashcard {
    static DIVIDER = "\t";
    static MEDIA_DIVIDER = ",";
    static INDEX_WORD            = 0;
    static INDEX_CARD_MODEL_TYPE = 1;
    static INDEX_MEDIA_FILES     = 2;
    constructor( word, card_model_type, media_files ){
        this.word = word;
        this.card_model_type = card_model_type;
        this.media_files = media_files;
    }

    toDBLine() {
        var db_line = this.word + Flashcard.DIVIDER + this.card_model_type + Flashcard.DIVIDER;

        // Convert media list to string
        var str_media_files = "";
        for( let i = 0; i < this.media_files.length; i++ ) {
            str_media_files += this.media_files[ i ];
            if( i < this.media_files.length -1) {
                // Put a comma after every file, except the last one.
                str_media_files += Flashcard.MEDIA_DIVIDER;
            }
        }

        db_line += str_media_files;
        return db_line;
    }

    static fromDBLine( db_line ) {
        const a = db_line.split( Flashcard.DIVIDER );
        const word            = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_WORD ];
        const card_model_type = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_CARD_MODEL_TYPE ];
        var   media_files     = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_MEDIA_FILES ];
        media_files = media_files.split( Flashcard.MEDIA_DIVIDER );
        if( (typeof media_files) == "string" ){
            media_files = [ media_files ];
        }
        var flashcard = new Flashcard( word, card_model_type,[ media_files ]);
        return flashcard;
    }
}

function generateFilePathForWord( video_title, file_extension ) {
    does_file_exist = true;
    let path = ""

    while( does_file_exist ) {
        path = './media/signbsl-' + video_title.toLowerCase() + "-" + generateRandomString(6) + file_extension;
        try {
            if (fs.existsSync(path)) {
                does_file_exist = true;
            } else {
                does_file_exist = false;
            }
        } catch(err) {
            console.error(err)
            does_file_exist = false;
        }
    }

    return path;
}

function fakeGenerateFilePathForWord( video_title, file_extension ) {
    return video_title;
}


function generateRandomString(length) {
    return crypto.randomBytes(length)
        .toString('hex') // convert to hexadecimal format
        .slice(0, length); // return required number of characters
}


function download( url, file_output_path ) {
    try {
        command_output = execSync('wget "' + url + '" -O "' + file_output_path + '"' , { encoding: 'utf-8' });
    } catch (error) {
        console.error(`Error executing command: ${error.message}`);
    }
}

function fake_download( url, file_output_path ) {
    console.log("fake download of " + url)
}

function get_all_video_url_and_names( html_file ) {
    let command_output;
    
    all_videos = [];
    all_words  = [];
    command_video_url_and_name = './video_url_and_name.py';
    try {
        command_output = execSync( command_video_url_and_name + ' ' + html_file, { encoding: 'utf-8' } );

        list_of_videos_and_words = command_output.trim().split("\n");

        for( let i = 0; i < list_of_videos_and_words.length; i++ ){
            all_words  = all_words.concat(  list_of_videos_and_words[i].split("\t")[0].toLowerCase() );
            all_videos = all_videos.concat( list_of_videos_and_words[i].split("\t")[1] );
        }
    } catch (error) {
        console.error(`Error executing command: ${error.message}`);
    }

    return [ all_words, all_videos ];
}

function fake_get_all_video_url_and_names( html_file ) {
    return [["letter aaa", "letter bb"], ["poo-c5aafe.webm","poo-847fda.webm"]];
}

//-----------------------\\
// Main execution start. \\
//-----------------------\\
module.exports = {
    scrape_signbsl : function ( words ) {
        var id = generateRandomString(8);
        var word = words[0];
        word = word.toLowerCase(); // make words match.

        html_path = "./signbsl-html/" + word + "-signbsl.com.html";
        console.log("Getting html file.");
        
        if( IS_SIMULATE_MODE ) {
            fake_download( 'https://www.signbsl.com/sign/' + word, html_path );
        } else {
            download( 'https://www.signbsl.com/sign/' + word, html_path );
        }
        
        
        console.log();
        console.log("Extracting words and videos.");
        if( IS_SIMULATE_MODE ) {
            all_videos_and_words = fake_get_all_video_url_and_names( html_path );
        } else {
            all_videos_and_words = get_all_video_url_and_names( html_path );
        }
        
        // Download all videos
        var all_video_filepaths = [];

        for( let i = 0; i < all_videos_and_words[0].length; i++ ) {
            const word = all_videos_and_words[0][i];
            const url  = all_videos_and_words[1][i];

            if( IS_SIMULATE_MODE ) {
                file_path = "./media/" + fakeGenerateFilePathForWord( url , '');
            } else {
                file_extension = path.extname( url );
                file_path = generateFilePathForWord( word, file_extension );
            }
        
            console.log("Downloading from " + url);
            if( IS_SIMULATE_MODE ) {
                fake_download( url, file_path);
            } else {
                download( url, file_path);
            }
        
            console.log("Converting to webm...")
            webm_file_path = path.parse(file_path).dir + "/" + path.parse(file_path).name + ".webm"
            all_video_filepaths = all_video_filepaths.concat( webm_file_path )

            if( IS_SIMULATE_MODE ) {
                console.log( "fake converting to webm for file " + file_path + " to " + webm_file_path );
            } else {
                ffmpeg_command = 'ffmpeg -ss 00:00:00 -i "' + file_path + '" "' + webm_file_path + '"'
                //ffmpeg_command = 'ffmpeg -ss 00:00:00 -i "' + file_path + '" -filter_complex "[0:v] fps=15;" "' + webm_file_path + '"'
                //ffmpeg_command = 'ffmpeg -ss 00:00:00 -i "' + file_path + '" -vf scale=iw*1:ih*1 "' + gif_file_path + '"'
        
                try {
                    command_ouput = execSync(ffmpeg_command, { encoding: 'utf-8' });
                } catch (error) {
                    console.error(`Error executing command: ${error.message}`);
                }
            }
        
            anki_line = word + "\t" + webm_file_path;
        }










        // Create flashcard DB lines.
        // Create a flashcard showing the sign language video as the front of the card. Text on back of card.
        all_videos_for_reverse_card = []
        all_cards = []
        for( let i = 0; i < all_video_filepaths.length; i++ ) {
            card = new Flashcard( word, "signlanguage-video-front-card-model", [ all_video_filepaths[i]] )
            all_cards = all_cards.concat( [card] )
            all_videos_for_reverse_card = all_videos_for_reverse_card.concat ( [ word, all_video_filepaths[i] ] )
        }


        reverse_card = new Flashcard( word, "signlanguagetext-front-card-model", all_videos_for_reverse_card )


        // TODO: make card with all videos - only videos with the word that is the same as the one we chose.
        // TODO: make card with all videos - make a way to say how many different versions there are so we can add it to the flashcard as bracets e.g. brown(2).


        all_db_card_lines = ""
        for( let i = 0; i < all_cards.length; i++ ){
            all_db_card_lines += all_cards[i].toDBLine();
            if( i < (all_cards.length - 1) ) {
                all_db_card_lines += "\n";
            }
        }
        //all_db_card_lines += reverse_card.toDBLine() + "\n"

        console.log( "all_db_card_lines" )
        console.log( all_db_card_lines )
        console.log( "----" )

        try {
            const flashcards_file_name = './new-flashcards-' + id + '.txt';

            fs.appendFileSync( flashcards_file_name, all_db_card_lines )
            console.log('Data successfully appended to file.');
        } catch (err) {
            console.error('Error appending to file:', err.message);
        }

        return [ id, [all_videos_and_words[0], all_video_filepaths] ];
    },


    make_flashcards : function ( id, chosen_videos ) {
        // Load flashcard list from file using id passed new-flashcards-{id}.txt
        const flashcards_file_name = './new-flashcards-' + id + '.txt';
        var anki_deck_file_name = "./decks/signbsl-anki-deck-" + id + ".apkg"
        fs.readFile( flashcards_file_name, 'utf8', ( error, data ) => {
            if( error ) {
                console.log("ah shit, error opening file: " + flashcards_file_name );
                return;
            }

            const all_lines = data.toString().split("\n");
            if( chosen_videos.length != all_lines.length ) {
                console.log( "error in make_flashcards()" );
                return;
            }

            var all_flashcards = "";
            // Loop through flashcards, extract the ones that were selected.
            for( let i = 0; i < all_lines.length; i++ ) {
                if( chosen_videos[i] ) {
                    all_flashcards += all_lines[i];
                    if( i < all_lines.length-1 ) {
                        all_flashcards += "\n"
                    }
                    console.log("Added flashcard to deck.");
                } else {
                    console.log("Not added flashcard to deck.");
                }
            }

            // Save user selected flashcards
            var chosen_flashcards_filename = "./new-user-selected-flashcards-" + id + ".txt"
            fs.writeFileSync( chosen_flashcards_filename, all_flashcards );

            // Send new flashcard list to genanki

            try {
                console.log( "Creating Anki Deck: " + anki_deck_file_name )
                command_output = execSync('./genanki_anki_flashcard_deck_creator.py "' + chosen_flashcards_filename + '"  "' + anki_deck_file_name + '"', { encoding: 'utf-8' });
                console.log( "Successfully Created Anki Deck: " + anki_deck_file_name )
            } catch (error) {
                console.error(`Error executing GenAnki Script: ${error.message}`);
            }
        });

        return anki_deck_file_name.slice( 2 ); // slice(2) to remove the first 2 characters which in this case is a dot-slash in the filename ./file.apkg


    // TODO: Figure out how reverse cards are stored

    // Make a small deck with just these cards.
    // Make a bigger deck with every flashcard ever.
    }
};
