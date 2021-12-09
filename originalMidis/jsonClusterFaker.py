# -*- coding: utf-8 -*-
"""
Created on Sat Dec  4 19:19:28 2021

@author: User
"""

import json

json_data = {
        '0_1097_t_1.00_.mid': [1,3], 
        '0_1356_t_1.00_.mid': [2,4], 
        '0_2572_t_1.00_.mid': [3,2], 
        '0_2736_t_1.00_.mid': [3,7], 
        '0_3215_t_1.00_.mid': [5,6], 
        '0_4081_t_1.00_.mid': [6,10], 
        '0_4383_t_1.00_.mid': [7,9], 
        '0_8231_t_1.00_.mid': [8,2], 
        '0_9970_t_1.00_.mid': [9,4]
    }

with open('clusterData.json', 'w') as f:
    json.dump(json_data, f)