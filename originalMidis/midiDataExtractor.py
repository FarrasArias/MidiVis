# -*- coding: utf-8 -*-
"""
Created on Thu Nov 25 09:53:35 2021

@author: Rafael Arias Gonzalez
"""

from mido import MidiFile
import mido
import math
import os
import json
from pprint import pprint

PATH = "transformerv5_Rafael_100 (1)/midiFiles/" #Change path to parse a different collection of files

#Look for only midi files
listdir = list(filter(lambda x: x[-3:] == "mid", os.listdir(PATH)))

all_files = {}

for file in listdir:
    mid = MidiFile(PATH+file)
    
    all_tracks = {}
    
    for i, track in enumerate(mid.tracks):
        track_name = i
        
        #Make a test print to look at the data
        if file == "0_1097_t_1.00_.mid":
            print('Track {}: {}'.format(i, track.name))
            
        tempo = None
        program = None
        notes = []
        
        #For each track, look for the necessary info and extract the note data
        for msg in track:
            if msg.type == "set_tempo":    
                tempo = round(mido.tempo2bpm(msg.tempo))
            elif msg.type == "program_change":
                program = msg.program
            elif msg.type == "note_on":
                notes.append([msg.channel, msg.note, msg.velocity, msg.time])

        all_tracks[track_name] = {
                "name" : track_name,
                "tempo" : tempo,
                "program" : program,
                "notes" : notes
            }
    
    #Make a test print to look at the data
    if file == "0_1097_t_1.00_.mid":
        pprint(all_tracks[0])
        
    all_files[file] = all_tracks

#Save all the info!
with open('midiDataTest.json', 'w') as f:
    json.dump(all_files, f)