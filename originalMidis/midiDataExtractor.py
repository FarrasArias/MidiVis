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

import time
import pandas as pd
from sklearn.manifold import TSNE
import numpy as np

PATH = "transformerv5_Rafael_45/midiFiles/" #Change path to parse a different collection of files

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

###############
#Implement T-SNE
###############

#Go through all the files and get an overall count of the repetitions of each note in each file
all_counts = {}

for key in all_files.keys():
  count_dict = {x:0 for x in range(256)}
  for number in all_files[key].keys():
    if (len(all_files[key][number]["notes"]) != 0):
      for i in range(len(all_files[key][number]["notes"])-1):
        if i%2 == 0:
          count_dict[all_files[key][number]["notes"][i][1]] += all_files[key][number]["notes"][i+1][3]
  all_counts[key] = count_dict

  df = pd.DataFrame(all_counts)

  df = df.T

  df_vals = df.values

#TSNE Implementation on note counts
time_start = time.time()
tsne = TSNE(n_components=2, verbose=1, perplexity=5, n_iter=300)
tsne_results = tsne.fit_transform(df_vals)

norm = np.around((tsne_results - tsne_results.min()) / (tsne_results.max() - tsne_results.min())*1000,0)
norm = norm.tolist()

#Store the info in per file and dump
final_dict = {}
for i,fi in enumerate(df.index):
  final_dict[fi] = list(norm[i])

with open('clusterData.json', 'w') as f:
    json.dump(final_dict, f)