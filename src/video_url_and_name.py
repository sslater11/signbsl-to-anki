#!/usr/bin/env python3

# © Copyright 2024, Simon Slater
#
# This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 2 of the License.
#
# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import sys

from bs4 import BeautifulSoup
html_contents = open( sys.argv[1] ,"r" )
soup = BeautifulSoup(html_contents, 'html.parser')

for video_div in soup.findAll('div', attrs={'itemprop':'video'}):
    url = str( video_div.find('source').get("src") )

    word_text = "" + str(video_div.find('i'))
    word_text = word_text.replace("<i>","")
    word_text = word_text.replace("</i>","")
    word_text = word_text.lower().strip()

    print( word_text + "\t" + url)

