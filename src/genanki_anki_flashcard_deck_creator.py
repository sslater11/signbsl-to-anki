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
    def __init__(self, db_line):
        self.DIVIDER = "\t"
        self.MEDIA_DIVIDER = ","
        self.db_line = db_line
        all_elements = db_line.split( self.DIVIDER )

        self.card_front       = all_elements[0]
        self.card_model_type  = all_elements[1]
        self.card_media_files = all_elements[2]
        self.card_media_files = self.card_media_files.strip().split( self.MEDIA_DIVIDER )
        print("card_media_files")
        print( self.card_media_files )

    def toDBLine( self ):
        db_line = self.card_front + self.DIVIDER + self.card_model_type + self.DIVIDER

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
                result += video_html + "<br><br>"
                if i < len(self.card_media_files) -1:
                    # Put a blank line after every line, except the last one.
                    result += "<br><br>"
        else:
            print( "Error, self.card_media_files was not a list" )

        return result



#my_model = genanki.Model(
#  1607491389,
#  'Simple Model',
#  fields=[
#    {'name': 'Question'},
#    {'name': 'Answer'},
#  ],
#  templates=[
#    {
#      'name': 'Card 1',
#      'qfmt': '{{Question}}',
#      'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
#    },
#  ])


my_model = genanki.Model(
    1607491389,
    'Simple Model',
    fields=[
        {'name': 'Question'},
        {'name': 'Answer'},
    ],
    templates=[
    {
        'name': 'Card 1',
        'qfmt': '{{Question}}',              # AND THIS
        'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
    },
])


#cheese2 = "cheese-b1974.gif"
cheese2 = "test123.jpg"
video_filename = "Cheese-724816.webm"
sign_language_video = '<video id="myvid1" src="' + video_filename + '" loop="true" autoplay="autoplay" controlslist="nodownload" controls=""></video>'



my_deck = genanki.Deck(
    2059403190,
    'TESTING BSL POO DECK')


### Test
#video_html = '<video id="myvid1" src="' + "a-1234.webm" + '" loop="true" autoplay="autoplay" controlslist="nodownload" controls=""></video>'
#my_note = genanki.Note(
#    model=my_model,
#    fields=["this is the one with ./ at the start of the path",video_html])
##fields=["one","Cheese!<img src=\"" + cheese2 + "\">"])
#
#my_deck.add_note(my_note)
#
#
#video_html = '<video id="myvid1" src="' + "a-1234.webm" + '" loop="true" autoplay="autoplay" controlslist="nodownload" controls=""></video>'
#my_note = genanki.Note(
#    model=my_model,
#    fields=["this is the one without ./ at the start of the path",video_html])
##fields=["one","Cheese!<img src=\"" + cheese2 + "\">"])
#
#my_deck.add_note(my_note)
#
#
#
#
#video_html = '<video id="myvid1" src="' + "b-1234.webm" + '" loop="true" autoplay="autoplay" controlslist="nodownload" controls=""></video>'
#my_note = genanki.Note(
#    model=my_model,
#    fields=["this is the one without ./ at the start of the path",video_html])
##fields=["one","Cheese!<img src=\"" + cheese2 + "\">"])
#
#my_deck.add_note(my_note)
#
#
## Save to anki deck.
#my_package = genanki.Package( my_deck, media_files = [ "./a-1234.webm", "b-1234.webm" ] )
#
#my_package.write_to_file('output2.apkg')
#
#
#
#
#
#exit()






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
        print( "fffffffffffffffff" )
        print(line )
        print( card.getMediaAsHTML() )
        print()
        # Create a note and add it to the deck

        my_note = genanki.Note(
            model = my_model,
            fields = [ card.card_front, card.getMediaAsHTML() ]
        )
        #fields=["one","Cheese!<img src=\"" + cheese2 + "\">"])
        my_deck.add_note( my_note )
        print("new - note ")
        print( my_note )

        # Add media file paths to one list, ignoring duplicates.
        for media_file in card.card_media_files:
            if media_file not in all_media_file_paths:
                all_media_file_paths += [ media_file ]


# Save to anki deck.
my_package = genanki.Package(my_deck, media_files = all_media_file_paths )
#my_package.media_files = [cheese2]

#my_package.write_to_file('output2.apkg')
my_package.write_to_file( output_flashcards_file )
