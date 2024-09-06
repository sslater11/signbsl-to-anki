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

/**
 * TODO:
 * Move vidoes that are used to a folder for the media.
 * Save all flashcards to a global deck.
 */
/* TODO:
    test whether filenames with quotes and brackets break this script and the genanki script.
    make this parse the string of words so that we can send a string like "cheese beef ham" and it will make flashcards for all 3 words.
*/


class WordAndVideos {
    constructor( word, video ){
        this.word = word.toLowerCase();
        this.videos = [ video ];
        this.converted_video_file_path = [];
    }

    addVideoURL( url ){
        this.videos = this.videos.concat( url );
        this.converted_video_file_path = this.converted_video_file_path.concat( "" );
    }

    setConvertedVideoFilePath( k, converted_video_file_path ) {
        this.converted_video_file_path[ k ] = converted_video_file_path;
    }

    getWord() {
        return this.word;
    }

    getVideoURLs(){
        return this.videos;
    }

    getVideoByIndex( index ) {
        return this.videos[ index ];
    }

    isTheSameWord( new_word ) {
        if( this.word.toLowerCase() == new_word.toLowerCase() ) {
            return true;
        } else {
            return false;
        }
    }

    toDBLine( video_index, card_model_type ) {
        const flashcard = new Flashcard( this.word, card_model_type, [ this.videos[ video_index ] ] );
        return flashcard.toDBLine();
    }

    toArrayWithConvertedVideoFile() {
        if( this.videos.length != this.converted_video_file_path.length ) {
            return null;
        } else {
            return [[ this.word, this.converted_video_file_path ]];
        }
    }
}


class Flashcard {
    static DIVIDER = "\t";
    static MEDIA_DIVIDER = ",";
    static INDEX_WORD            = 0;
    static INDEX_CARD_MODEL_TYPE = 1;
    static INDEX_MEDIA_FILES     = 2;
    static CARD_MODEL_VIDEO_FRONT = "signlanguage-video-front-card-model"
    static CARD_MODEL_TEXT_FRONT  = "signlanguage-text-front-card-model"
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
    
    all_words  = [];
    command_video_url_and_name = './video_url_and_name.py';
    try {
        command_output = execSync( command_video_url_and_name + ' ' + html_file, { encoding: 'utf-8' } );

        list_of_videos_and_words = command_output.trim().split("\n");

        for( let i = 0; i < list_of_videos_and_words.length; i++ ){
            const word  = list_of_videos_and_words[i].split("\t")[0];
            const video = list_of_videos_and_words[i].split("\t")[1];

            // Does the word already exist in list?
            var word_index = -1;
            for( let k = 0; k < all_words.length; k++ ) {
                if( all_words[k].isTheSameWord( word ) ) {
                    word_index = k;
                    break;
                }
            }

            if( word_index != -1 ){
                // Add the video to the existing list.
                all_words[ word_index ].addVideoURL( video );
            } else {
                // Add the video and word to the list.
                new_word = new WordAndVideos( word, video );
                all_words  = all_words.concat( new_word );
            }
        }
    } catch (error) {
        console.error(`Error executing command: ${error.message}`);
    }

    return all_words;
}

function fake_get_all_video_url_and_names( html_file ) {
    word = new WordAndVideos( "poo", "poo-c5aafe.webm" );
    return [ word ];
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
        for( let i = 0; i < all_videos_and_words.length; i++ ) {
            const word = all_videos_and_words[i];
            number_of_videos = word.getVideoURLs().length;

            for( let k = 0; k < number_of_videos; k++ ) {
                const url = word.getVideoURLs()[k];

                if( IS_SIMULATE_MODE ) {
                    file_path = "./media/" + fakeGenerateFilePathForWord( url , '');
                } else {
                    file_extension = path.extname( url );
                    file_path = generateFilePathForWord( word.getWord(), file_extension );
                }

                console.log("Downloading from " + url);
                if( IS_SIMULATE_MODE ) {
                    fake_download( url, file_path);
                } else {
                    download( url, file_path);
                }

                console.log("Converting to webm...")
                webm_file_path = path.parse(file_path).dir + "/" + path.parse(file_path).name + ".webm"
                all_videos_and_words[i].setConvertedVideoFilePath( k, webm_file_path + "" );

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

            }
        }

        var all_words = [];
        for( let i = 0; i < all_videos_and_words.length; i++ ) {
            all_words = all_words.concat( all_videos_and_words[i].toArrayWithConvertedVideoFile() );
        }

        return [ id, all_words ];
    },


    make_flashcards : function ( id, all_words_and_videos ) {
        // Make a new database from the data passed.
        const INDEX_WORD      = 0;
        const INDEX_VIDEO     = 1;
        const INDEX_IS_CHOSEN = 2;
        const anki_deck_file_name = "./decks/signbsl-anki-deck-" + id + ".apkg";

        // Make a list of all the db lines from the list the user sent over.
        all_db_lines = "";
        number_of_words = all_words_and_videos.length;
        for( let i = 0; i < number_of_words; i++ ) {
            const number_of_videos = all_words_and_videos[i][INDEX_VIDEO].length;
            const word = all_words_and_videos[i][INDEX_WORD];

            var all_videos_for_this_word = "";
            for( let k = 0; k < number_of_videos; k++ ) {
                const is_chosen = all_words_and_videos[i][INDEX_IS_CHOSEN][k];
                if( is_chosen ) {
                    // Convert to db line
                    const video = all_words_and_videos[i][INDEX_VIDEO][k];
                    
                    if( k == 0 ){
                        console.log("not adding a blank line");
                        all_videos_for_this_word += video;
                    } else {
                        console.log("adding a blank line");
                        all_videos_for_this_word += "," + video;
                    }
                    flashcard = new Flashcard( word, Flashcard.CARD_MODEL_VIDEO_FRONT, [ video ] );
                    const db_line = word + Flashcard.DIVIDER + Flashcard.CARD_MODEL_VIDEO_FRONT + Flashcard.DIVIDER + video;
                    all_db_lines += db_line + "\n";
                }
            }

            // Add a flashcard with all the videos for a single word.
            const word_with_number_of_videos = word + "<br>(" + number_of_videos + ")"
            const db_line = word_with_number_of_videos + Flashcard.DIVIDER + Flashcard.CARD_MODEL_TEXT_FRONT + Flashcard.DIVIDER + all_videos_for_this_word;
            if( i == number_of_words -1 ) {
                // Don't add a blank line at the end of the last line.
                all_db_lines += db_line;
            } else {
                all_db_lines += db_line + "\n";
            }
        }

        // Save user selected flashcards
        var chosen_flashcards_filename = "./new-user-selected-flashcards-" + id + ".txt"
        fs.writeFileSync( chosen_flashcards_filename, all_db_lines);

        // Send new flashcard list to genanki
        try {
            console.log( "Creating Anki Deck: " + anki_deck_file_name )
            command_output = execSync('./genanki_anki_flashcard_deck_creator.py "' + chosen_flashcards_filename + '"  "' + anki_deck_file_name + '"', { encoding: 'utf-8' });
            console.log( "Successfully Created Anki Deck: " + anki_deck_file_name )

            // TODO: Make a bigger deck with every flashcard ever.
        } catch (error) {
            console.error(`Error executing GenAnki Script: ${error.message}`);
        }
        return anki_deck_file_name.slice( 2 ); // slice(2) to remove the first 2 characters which in this case is a dot-slash in the filename ./file.apkg
    }
};
