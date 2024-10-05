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
const { allowedNodeEnvironmentFlags } = require("process");

const util = require('util');
const execPromise = util.promisify( exec );

const IS_SIMULATE_MODE = false;

/* TODO:
    test whether filenames with quotes and brackets break this script and the genanki script.
    make this parse the string of words so that we can send a string like "cheese beef ham" and it will make flashcards for all 3 words.
*/


class WordAndVideos {
    constructor( word, video ){
        this.word = word.toLowerCase();
        this.videos = [ video ];
        this.converted_video_file_name = [];
    }

    addVideoURL( url ){
        this.videos = this.videos.concat( url );
        this.converted_video_file_name = this.converted_video_file_name.concat( "" );
    }

    setCovertedVideoFileName( k, converted_video_file_name ) {
        this.converted_video_file_name[ k ] = converted_video_file_name;
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
        const flashcard = new Flashcard( this.word, this.guid_key, card_model_type, [ this.videos[ video_index ] ] );
        return flashcard.toDBLine();
    }

    toArrayWithConvertedVideoFile() {
        if( this.videos.length != this.converted_video_file_name.length ) {
            return null;
        } else {
            return [[ this.word, this.converted_video_file_name ]];
        }
    }
}


class Flashcard {
    static DIVIDER = "\t";
    static MEDIA_DIVIDER = ",";
    static INDEX_WORD            = 0;
    static INDEX_GUID_KEY        = 1;
    static INDEX_CARD_MODEL_TYPE = 2;
    static INDEX_MEDIA_FILES     = 3;
    static CARD_MODEL_VIDEO_FRONT = "signlanguage-video-front-card-model"
    static CARD_MODEL_TEXT_FRONT  = "signlanguage-text-front-card-model"
    constructor( word, guid_key, card_model_type, media_files ){
        this.word = word;
        this.guid_key = guid_key;
        this.card_model_type = card_model_type;
        this.media_files = media_files;
    }

    toDBLine() {
        let db_line = this.word + Flashcard.DIVIDER + this.guid_key + Flashcard.DIVIDER + this.card_model_type + Flashcard.DIVIDER;

        // Convert media list to string
        let str_media_files = "";
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
        try {
            const word            = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_WORD ];
            const guid_key        = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_GUID_KEY ];
            const card_model_type = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_CARD_MODEL_TYPE ];
            let   media_files     = db_line.split( Flashcard.DIVIDER )[ Flashcard.INDEX_MEDIA_FILES ];
            media_files = media_files.split( Flashcard.MEDIA_DIVIDER );

            if( (typeof media_files) == "string" ){
                media_files = [ media_files ];
            }

            const flashcard = new Flashcard( word, guid_key, card_model_type,[ media_files ]);
            return flashcard;
        } catch {
            return null;
        }
    }
}


function generateFileNameForWord( video_title, file_extension ) {
    let does_file_exist = true;
    let filename = "";

    while( does_file_exist ) {
        filename = 'signbsl-' + video_title.toLowerCase() + "-" + generateRandomString(6) + file_extension;
        try {
            if ( fs.existsSync( "./media/" + filename ) ) {
                does_file_exist = true;
            }
            else if ( fs.existsSync( "./public/cache/" + filename ) ) {
                does_file_exist = true;
            }
            else {
                does_file_exist = false;
            }
        } catch( err ) {
            console.error( err )
            does_file_exist = false;
        }
    }

    return filename;
}

function fakeGenerateFileNameForWord( video_title, file_extension ) {
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

function get_all_video_url_and_names( html_file, page_word ) {
    let command_output;
    let word = "";
    
    all_words  = [];
    command_video_url_and_name = './video_url_and_name.py';
    try {
        command_output = execSync( command_video_url_and_name + ' ' + html_file, { encoding: 'utf-8' } );

        list_of_videos_and_words = command_output.trim().split("\n");

        for( let i = 0; i < list_of_videos_and_words.length; i++ ){
            word        = list_of_videos_and_words[i].split("\t")[0];
            const video = list_of_videos_and_words[i].split("\t")[1];
            word = phrase_to_clean_string( word );

            // Does the word already exist in list?
            let word_index = -1;
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
                all_words = all_words.concat( new_word );
            }
        }
    } catch (error) {
        if( error.status == 100 ) {
            return ["Error", "No results found for: \"" + page_word +"\"" ];
        }
        console.error(`Error executing command: ${error.message}`);
        return [ "Error", error.message ];
    }

    return all_words;
}

function fake_get_all_video_url_and_names( html_file ) {
    word = new WordAndVideos( "poo", "poo-c5aafe.webm" );
    return [ word ];
}


function getAllDBFiles( subpath ) {
    const app_directory_path = path.dirname(process.mainModule.filename); // Absolute path to our app directory
    let files = fs.readdirSync( app_directory_path + subpath );
    let files_with_stats = [];
    
    files.forEach( file => {
        let stats = fs.statSync( app_directory_path + subpath + '/' + file );
        files_with_stats.push( { filename: file, date: new Date( stats.ctime ), path: app_directory_path + subpath + '/' + file } );
    } );
    
    // Sort files by date. Newest date last, so the database lines will be in order.
    files_with_stats.sort( (a, b) => a.date - b.date );
    
    return files_with_stats;
};

function getAllDBLinesFromEveryDeck() {
    // Get list of files by their date
    const all_db_files = getAllDBFiles("/decks/");

    let all_db_lines = "";
    // Multiple database files. Load every line from each of the db files.
    for( let i = 0; i < all_db_files.length; i++ ) {
        let filename = all_db_files[i]["filename"];
        if( filename.match("new-user-selected-flashcards-") != null ) {
            all_db_lines += fs.readFileSync( all_db_files[i]["path"], 'UTF8' ) + "\n";
            console.log( all_db_lines );
        }
    }

    return all_db_lines
}

async function downloadAndConvertVideos( all_videos_and_words ) {
    try {
        //Download and convert on multiple threads using promises.
        let promises = [];
        for( let i = 0; i < all_videos_and_words.length; i++ ) {
            console.log(" all_videos_and_words ")
            console.log( all_videos_and_words )
            const word_and_videos = all_videos_and_words[i];
            const number_of_videos = word_and_videos.getVideoURLs().length;
            for( let k = 0; k < number_of_videos; k++ ) {
                promises.push( downloadAndConvertSingleVideo( all_videos_and_words[i], k ) );
            }
            // Wait for all downloading and converting to be finished.
            await Promise.all( promises );
        }
    } catch( error ) {
        return false;
    }

    return true;
}

async function downloadAndConvertSingleVideo( word_and_videos, k ) {
    try {
        // Download all videos
        const url = word_and_videos.getVideoURLs()[k];
        let file_path = "";

        if( IS_SIMULATE_MODE ) {
            file_path = "./public/cache/" + fakeGenerateFileNameForWord( url , '');
        } else {
            if( url === undefined || url === null ) {
                throw new Error( "Error: No videos for " + word );
            } else {
                const file_extension = path.extname( url );
                file_path = "./public/cache/" + generateFileNameForWord( word_and_videos.getWord(), file_extension );
            }
        }

        console.log("Downloading from " + url);
        if( IS_SIMULATE_MODE ) {
            fake_download( url, file_path);
        } else {
            try {
                const download_command_output = await execPromise('wget "' + url + '" -O "' + file_path + '"' , { encoding: 'utf-8' });
            } catch ( error ) {
                throw error;
            }
        }

        console.log("Converting to webm...")
        //webm_file_path = path.parse(file_path).dir + "/" + path.parse(file_path).name + ".webm"
        const webm_file_name = path.parse(file_path).name + ".webm"
        word_and_videos.setCovertedVideoFileName( k, webm_file_name );

        if( IS_SIMULATE_MODE ) {
            console.log( "fake converting to webm for file " + file_path + " to " + webm_file_name );
        } else {
            ffmpeg_command = 'ffmpeg -threads 4 -ss 00:00:00 -i "' + file_path + '" "./public/cache/' + webm_file_name + '"'
            //ffmpeg_command = 'ffmpeg -ss 00:00:00 -i "' + file_path + '" -filter_complex "[0:v] fps=15;" "' + webm_file_name + '"'
            //ffmpeg_command = 'ffmpeg -ss 00:00:00 -i "' + file_path + '" -vf scale=iw*1:ih*1 "' + gif_file_path + '"'

            try {
                let command_ouput = await execPromise(ffmpeg_command, { encoding: 'utf-8' });
            } catch (error) {
                console.error(`Error executing command: ${error.message}`);
                throw error;
            }
        }
    } catch ( error ) {
        console.error( "Oh cheese no! " + error );
        throw error;
    }
}

function clean_string( str ) {
    // Only keeps alphabet letters, numbers, whitespace and hypens.
    const result = str.trim().replace(/[^a-zA-Z\s\-0-9]/g, '').toLowerCase();
    return result;
}

function phrase_to_clean_string( str ){
        str = clean_string( str );
        str = str.replace(/\s+/g, '-'); // Replace multiple whitespace with a single hyphen

        return str;
}

function get_all_phrases_inside_quotes( str ) {
    // Regular expression to match substrings inside single or double quotes
    const regex = /(['"])(.*?)\1/g;
    const phrases = [];
    let match;

    // Use the regex to find all matches in the string
    while ((match = regex.exec(str)) !== null) {
        const substring = phrase_to_clean_string( match[2] ); // match[2] contains the content inside the quotes.
        if( substring != "" ){
            phrases.push( substring );
        }
    }

    return phrases;
}


function get_all_words( str ) {
    // Remove phrases from the string.
    // Use a regular expression to match and remove substrings inside single or double quotes
    str = str.replace(/(['"])(.*?)\1/g, '').trim();
    str = clean_string( str );

    if( str == "" ){
        return [];
    } else {
        return str.split(/\s+/);
    }
}


//-----------------------\\
// Main execution start. \\
//-----------------------\\
module.exports = {
    Flashcard,
    scrape_signbsl : async function ( words ) {
        let id = generateRandomString(8);
        let all_words = [];

        let all_words_and_phrases = get_all_words( words ).concat( get_all_phrases_inside_quotes( words ) );

        for( i = 0; i < all_words_and_phrases.length; i++ ) {
            let word = all_words_and_phrases[i];
            if( word == '' ) {
                continue;
            }

            const html_path = "./signbsl-html/" + word + "-signbsl.com.html";
            console.log("Getting html file.");
        
            if( IS_SIMULATE_MODE ) {
                fake_download( 'https://www.signbsl.com/sign/' + word, html_path );
            } else {
                download( 'https://www.signbsl.com/sign/' + word, html_path );
            }
        
            console.log();
            console.log("Extracting words and videos.");
            let all_videos_and_words = null;
            if( IS_SIMULATE_MODE ) {
                all_videos_and_words = fake_get_all_video_url_and_names( html_path );
            } else {
                all_videos_and_words = get_all_video_url_and_names( html_path, word );
            }

            if( all_videos_and_words[0] == "Error" ) {
                return all_videos_and_words;
            }

            if( await downloadAndConvertVideos( all_videos_and_words ) == false ) {
                return[ "Error", "Failed to download or convert videos." ];
            }

            for( let k = 0; k < all_videos_and_words.length; k++ ) {
                all_words = all_words.concat( all_videos_and_words[k].toArrayWithConvertedVideoFile() );
            }
        }

        return [ id, all_words ];
    },


    /**
     * This will create 2 decks.
     *      A small one with just the new cards
     *      A complete one with every card we've ever created.
     * @param {*} id 
     * @param {*} all_words_and_videos 
     * @returns The path to both created decks.
     */
    make_flashcards : function ( id, all_words_and_videos ) {
        // Make a new database from the data passed.
        const INDEX_WORD      = 0;
        const INDEX_VIDEO     = 1;
        const INDEX_IS_CHOSEN = 2;
        const anki_deck_file_name = "./decks/signbsl-anki-deck-" + id + ".apkg";
        const anki_deck_complete_file_name = "./decks/signbsl-anki-deck-complete-" + id + ".apkg";

        // Make a list of all the db lines from the list the user sent over.
        let new_db_lines = "";
        const number_of_words = all_words_and_videos.length;
        for( let i = 0; i < number_of_words; i++ ) {
            const number_of_videos = all_words_and_videos[i][INDEX_VIDEO].length;
            const word = all_words_and_videos[i][INDEX_WORD];

            let all_videos_for_this_word = "";
            let is_first_video_added = false;
            let number_of_chosen_videos = 0;
            for( let k = 0; k < number_of_videos; k++ ) {
                const is_chosen = all_words_and_videos[i][INDEX_IS_CHOSEN][k];
                if( is_chosen ) {
                    number_of_chosen_videos++;
                    // Convert to db line
                    const video = all_words_and_videos[i][INDEX_VIDEO][k];
                    
                    if( is_first_video_added == false ){
                        is_first_video_added = true;
                        all_videos_for_this_word += video;
                    } else {
                        all_videos_for_this_word += "," + video;
                    }
                    const guid_key = word + k;
                    const db_line = word + Flashcard.DIVIDER + guid_key + Flashcard.DIVIDER + Flashcard.CARD_MODEL_VIDEO_FRONT + Flashcard.DIVIDER + video;
                    new_db_lines += db_line + "\n";
                }
            }

            if( number_of_chosen_videos > 0 ) {
                // Add a flashcard with all the videos for a single word.
                const word_with_number_of_videos = word + "<br>(" + number_of_chosen_videos + ")"
                const guid_key = word + "_all_videos";
                const db_line = word_with_number_of_videos + Flashcard.DIVIDER + guid_key + Flashcard.DIVIDER + Flashcard.CARD_MODEL_TEXT_FRONT + Flashcard.DIVIDER + all_videos_for_this_word;
                new_db_lines += db_line + "\n";
            }
        }


        // Get every db line that has ever been created.
        let all_db_lines = getAllDBLinesFromEveryDeck();
        let all_db_lines_as_array = all_db_lines.split("\n");

        // Check if any of the words have been turned into flashcards already.
        // TODO: Inefficient exponential search.
        //       Write a better algorithm.
        for( let i = 0; i < all_words_and_videos.length; i++ ) {
            for( let k = 0; k < all_db_lines_as_array.length; k++ ) {
                const line = all_db_lines_as_array[k];
                const word = line.split( Flashcard.DIVIDER )[0];
                if( word == all_words_and_videos[i][INDEX_WORD]) {
                    // Return an error to the user
                    return [ "Error", "Word already exists in deck: " + word ];
                }
            }
        }

        // Copy all video files from cache over to the media folder.
        for( let i = 0; i < number_of_words; i++ ) {
            const number_of_videos = all_words_and_videos[i][INDEX_VIDEO].length;
            for( let k = 0; k < number_of_videos; k++ ) {
                const is_chosen = all_words_and_videos[i][INDEX_IS_CHOSEN][k];
                if( is_chosen ) {
                    // Move the video file.
                    const video = all_words_and_videos[i][INDEX_VIDEO][k];
                    const cache_video_path = "./public/cache/" + video;
                    const media_video_path = "./media/" + video;
                    fs.copyFile(cache_video_path, media_video_path, (err) => {
                        if (err) {
                            console.error('Error copying file:', err);
                            return [ "Error: copying files." ];
                        }
                    });
                }
            }
        }

        // Add the new flashcards to the list.
        all_db_lines += new_db_lines;

        // Save user selected flashcards
        const chosen_flashcards_filename = "./decks/new-user-selected-flashcards-" + id + ".txt"
        fs.writeFileSync( chosen_flashcards_filename, new_db_lines);

        const all_chosen_flashcards_filename = "./decks/all-flashcards-" + id + ".txt";
        fs.writeFileSync( all_chosen_flashcards_filename, all_db_lines);

        // Generate anki decks with genanki.
        try {
            console.log( "Creating Anki Decks: " + anki_deck_file_name )
            command_output = execSync('./genanki_anki_flashcard_deck_creator.py "' +     chosen_flashcards_filename + '"  "' + anki_deck_file_name + '"', { encoding: 'utf-8' });
            console.log( "Successfully Created Anki Deck: " + anki_deck_file_name )

            command_output = execSync('./genanki_anki_flashcard_deck_creator.py "' + all_chosen_flashcards_filename + '"  "' + anki_deck_complete_file_name + '"', { encoding: 'utf-8' });
            console.log( "Successfully Created Anki Deck: " + anki_deck_complete_file_name )
        } catch (error) {
            console.error(`Error executing GenAnki Script: ${error.message}`);
        }

        const path_to_anki_deck = anki_deck_file_name.slice( 2 ); // slice(2) to remove the first 2 characters which in this case is a dot-slash in the filename ./file.apkg
        const path_to_complete_anki_deck = anki_deck_complete_file_name.slice( 2 ); // slice(2) to remove the first 2 characters which in this case is a dot-slash in the filename ./file.apkg

        return [path_to_anki_deck, path_to_complete_anki_deck ]
    },

    get_last_generated_deck : function ( subpath, as_text_file = false ) {
        const app_directory_path = path.dirname(process.mainModule.filename); // Absolute path to our app directory
        let files = fs.readdirSync( app_directory_path + subpath );
        let files_with_stats = [];
    
        files.forEach( file => {
            let stats = fs.statSync( app_directory_path + subpath + '/' + file );
            files_with_stats.push( { filename: file, date: new Date( stats.ctime ), path: app_directory_path + subpath + '/' + file } );
        } );
    
        // Sort files by date. Newest date last, so the database lines will be in order.
        files_with_stats.sort( (a, b) => a.date - b.date );
    
        for( let i = files_with_stats.length-1; i >=0; i-- ) {
            let filename = files_with_stats[i]["filename"];
            let filename_to_match = "";
            if( as_text_file ) {
                filename_to_match = "all-flashcards-";
            } else {
                filename_to_match = "signbsl-anki-deck-complete-";
            }

            if( filename.match( filename_to_match ) != null ) {
                return subpath.slice(1) + filename; // Slice to remove the forward slash from the beginning of /decks/ subpath
            }
        }

        return null;
    }
};
