#!/usr/bin/env python3
# © Copyright 2024, Simon Slater
#
# This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 2 of the License.
# 
# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import genanki
import os
import sys

def help():
    print("Description:")
    print("\tA simple script to greate a BSL Flashcard deck.")
    print("\tPass a text file with the right text format and it will output a BSL deck.")
    print("\tRead the code for the correct format to save the db text.")
    print("")
    print("Usage:")
    print("\t./genanki_anki_flashcard_deck_creator.py  input_file_name  output_file_name")
    print("\t")
    exit()

# Text file DB layout
# FRONT    MODEL_TYPE    MEDIA_FILE,OTHER_MEDIA_FILE,ETC
class SignLanguageCard:
    CARD_MODEL_VIDEO_FRONT = "signlanguage-video-front-card-model"
    CARD_MODEL_TEXT_FRONT  = "signlanguage-text-front-card-model"

    def __init__(self, db_line):
        self.DIVIDER = "\t"
        self.MEDIA_DIVIDER = ","
        self.db_line = db_line
        all_elements = db_line.split( self.DIVIDER )

        self.card_word        = all_elements[0].replace("-"," ")
        self.guid_key         = all_elements[1]
        self.card_model_type  = all_elements[2]
        self.card_media_files = all_elements[3]
        self.card_media_files = self.card_media_files.strip().split( self.MEDIA_DIVIDER )
        print("card_media_files")
        print( self.card_media_files )

    def toDBLine( self ):
        db_line = self.card_word + self.DIVIDER + self.guid_key + self.DIVIDER + self.card_model_type + self.DIVIDER

        # Convert media list to string
        # Check if it's a string or a list
        media_files = ""
        if type(self.card_media_files) == list:
            for i in range( len(self.card_media_files) ):
                media_files += self.card_media_files[ i ]
                if i < len(self.card_media_files) -1:
                    # Put a comma after every file, except the last one.
                    media_files += ","

        db_line += media_files
        return db_line

    def getMediaAsHTML( self ):
        result = ""
        # Check if it's a string or a list
        if type(self.card_media_files) == list:
            for i in range( len(self.card_media_files) ):
                video_file = os.path.basename( self.card_media_files[i] )
                video_html = '<video id="myvid1" src="' + video_file + '" loop="true" autoplay="autoplay" controlslist="nodownload" controls=""></video>'
                result += video_html
                if i < len(self.card_media_files) -1:
                    # Put a blank line after every line, except the last one.
                    result += "<br>"
        else:
            print( "Error, self.card_media_files was not a list" )

        return result

    def getNumberOfVideos( self ):
        return len( self.card_media_files )

    def getCardModelType( self ):
        return self.card_model_type

    def isCardTypeVideoFront( self ):
        if( self.card_model_type == self.CARD_MODEL_VIDEO_FRONT ):
            return True
        else:
            return False

    def isCardTypeWordFront( self ):
        if( self.card_model_type == self.CARD_MODEL_TEXT_FRONT ):
            return True
        else:
            return False


class MyBSLNote(genanki.Note):
    def __init__(self, model=None, fields=None, sort_field=None, tags=None, guid=None, due=0, guid_key=None ):
        super().__init__(model=model, fields=fields, sort_field=sort_field, tags=tags, guid=guid, due=due)
        if( guid_key == None ):
            print()
            print("guid_key not passed.\nAborting flashcard deck creation...")
            exit(-200)
        else:
            print("guidkey")
            print(guid_key)
            # Genanki seems to use the value _guid and guid, so assign both I guess.
            self.guid  = MyBSLNote.guid_from_key( guid_key)
            self._guid = MyBSLNote.guid_from_key( guid_key)
            print( self.guid )

    @property
    def guid( self, new_guid ):
        self.guid = new_guid
        self._guid = new_guid
    def guid( self ):
        return self.guid

    @staticmethod
    def guid_from_key( guid_key ):
        return genanki.guid_for( guid_key )

css = '''.card {
    font-family: arial;
    font-size: 34px;
    text-align: center;
    color: black;
    background-color: white;
}'''

my_video_model = genanki.Model(
    9681166405,
    'BSL Video Model',
    fields=[
        {'name': 'Word'},
        {'name': 'Explanation'},
        {'name': 'Video'},
    ],
    templates=[
        {
            'name': 'Card Video',
            'qfmt': '{{Video}}',
            'afmt': '{{FrontSide}}<hr id="answer">{{Word}}<div><p>{{Explanation}}</p></div>',
        },
    ],
    css=css
)

my_word_model = genanki.Model(
    4797280728,
    'BSL Word Model',
    fields=[
        {'name': 'Word'},
        {'name': 'Explanation'},
        {'name': 'Video'},
    ],
    templates=[
        {
            'name': 'Card Word',
            'qfmt': '{{Word}}',
            'afmt': '{{FrontSide}}<hr id="answer">{{Video}}<div><p>{{Explanation}}</p></div>',
        },
    ],
    css=css
)


my_deck = genanki.Deck(
    1193543062,
    'SignBSL - Fuck Yeah!'
)


all_media_file_paths : list = []


if( len(sys.argv) > 2 ):
    if sys.argv[1].lower() == "--help":
        help()
        exit()
    if sys.argv[1].lower() == "-h":
        help()
        exit()
else:
    help()
    exit()

passed_flashcards_file = sys.argv[1]
output_flashcards_file = sys.argv[2]
# Read all new DB lines.
db_file = open( passed_flashcards_file, "r" )
for line in db_file:
    if line.strip() != "":
        card = SignLanguageCard( line )
        # Create a note and add it to the deck

        current_model = None
        if card.isCardTypeWordFront():
            current_model = my_word_model
        elif card.isCardTypeVideoFront():
            current_model = my_video_model
        else:
            printf("ERROR: UNKNOWN CARD MODEL SET!")
            exit( -100 )
        my_note = MyBSLNote(
            model = current_model,
            fields = [ card.card_word, "", card.getMediaAsHTML() ],
            guid_key = card.guid_key
        )
        my_deck.add_note( my_note )

        # Add media file paths to one list, ignoring duplicates.
        for media_file in card.card_media_files:
            if media_file not in all_media_file_paths:
                all_media_file_paths += [ "./media/" + media_file ]


# Save to anki deck.
my_package = genanki.Package(my_deck, media_files = all_media_file_paths )

my_package.write_to_file( output_flashcards_file )
