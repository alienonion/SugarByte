# SugarByte

SugarByte (https://balddinosaur.users.earthengine.app/view/csirosugarbyte) is essentially a satellite-based web application that focuses on crop fertilizer surveillance. This project is supervised by Dr.Yuri Shendryk, who is a member of working at Commonwealth Scientific and Industrial Research Organization (CSIRO). This project particularly has significance on the preservation of the Great Barrier Reef, one of the significant symbol of Australia, which prevents the Great Barrie Reef from bleaching by excessive use of fertilizer. 

## Code Guide
![alt text](https://i.imgur.com/gMYPwhn.png)
According to our client’s requirement, the code we work on is based on which provided by the proposal team NDVI from last semester. The team NDVI also works on this project but implements different features from ours this semester.
### app.js
The main file imports all the required scripts and initialises or instantiates all internal modules utilised by the application. app.js should be run to see the outcome of the whole project.
### image_visualiser.js
The visualiser tool to show NDVI, elevation and soil layer on the map. The NDVI layer can be shown on different dates and whether clipped to the specific paddock.
The soil and elevation layer which are not related to time can be shown whether or not clipped to the paddock.
### information_panel_factory.js
Create a panel to show information about the paddock selected in map_click_handler.js. It includes 1) the period selection function 2) generate chart on the chosen period 3) layer (NDVI, soil and elevation) selection. Use image_visualiser.js to show NDVI layers on the date selected on the generated chart. Use layer_select_widget.js to switch layers among NDVI, soil and elevation layer.
### layer_selet_widget.js
The layer select widget called by information_panel_factory.js. Create a selector widget for users to switch among NDVI, soil and elevation layer. 
### legend_widget.js
A panel widget called by information_panel_factory.js. Create the legend related to the layer to be shown on the map. The widget is placed at the bottom centre of the map.
### timeline.js
Create a date slider widget called by information_panel_factory.js. As the NDVI data are collected every 5 days, the data range is made to 5. The widget is placed at the top centre of the map.


## Authors and Acknowledgment
Authors: Chao Lin; Wei Chen; Chenxi Li; Jiasheng Li; Huiyu Zeng; Qiyao Jiang; Yiheng Zhang

Based on code from team NDVI : Team NDVI (2019) SugarByte source code (Version 1.0) [Source code]. https://csiro1622crop.users.earthengine.app/view/csiro-1622-project
