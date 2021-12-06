
/* Code developed by Rafael Arias Gonzalez. It makes use of no added libraries except for P5.js and native JS libraries.
The code was developed using node.js to create a server to host the scripts and data, since the code reads JSON files and png images.
In order to run the script using a node server, please follow the instructions in the Node http-server section in 
https://github.com/processing/p5.js/wiki/Local-server. The setup should be straighforward and exactly as stated in the website.

The first window shows visual representations of the MIDI files. Two JSONs with already parsed data are provided to test the responsivity
of the system (look at the data variable in the preload() function). The only enabled button in the current version is the select button
(first button, with a check mark). If you click it, that file will be selected as the main file, and the sorting and visualization will 
change accordingly.

The second window (move the switch on the top part of the interface) shows a Mokcup Cluster visualization. The window allows the user to
click and drag for movement, zoom in and out with mouse wheel, and select a specific track. None of the buttons in the transport area
are enabled.

However, all the functions for those buttons exist in the code, and will be connected to API calls to the Apollo server when the system
is integrated.
*/

//Define global constants
const topBarHeight = 30;
const visualizerHeight = 800;
const buttonDims = [40,20,30];

//Define global variables
//Color variables
let redColor;
let redColorAlpha;

//Button variables
let playButton;
let trashCan;
let selectFile;
let download;

//Global mode status (MidiVisViewer or MidiVisCluster)
let mode;

//Define the variable that holds the MIDI data
let data;

//Variables to instantiate the two main classes
let mid;
let clus;

let currSelection = [];

//It is important to preload all the data and image info because of JS asynchronicity
function preload()
{
  redColor = color(244,67,54);
  redColorAlpha = color(244,67,54,40)

  data = loadJSON("originalMidis/midiData.json");  // try "originalMidis/midiData.json" and "originalMidis/midiData2.json"
  playButton = loadImage("data/playWhite.png");
  trashCan = loadImage("data/delete1.png");
  selectFile = loadImage("data/check1.png");
  download = loadImage("data/download1.png");


  dataClus = loadJSON("originalMidis/clusterData.json");
}

//Start a mode and create the two main classes
function setup() {
  createCanvas(windowWidth/2, windowHeight);

  mode = 0;
      
  mid = new songVis(0,0,800,800,data);
  clus = new cluster(dataClus);
  
  coords = false;
}

//Call the main classes mouse functions when it's pressed
function mousePressed()
{
  if (abs(mouseX-width/2)<buttonDims[0] && abs(mouseY-topBarHeight/2)<buttonDims[1])
    mode = !mode;
  if(!mode)
    mid.onClick();
  else
    clus.onClick();
}

//Call the midiVisCluster drag function
function mouseDragged()
{
  if(mode)
    clus.onMouseDrag();
}

//Call the midiVisCluster scroll function
function mouseWheel(event)
{
  if(mode)
    clus.onMouseScroll(event.delta);
  return false;
}

//Left for future updates
function mouseReleased()
{
}

//Draw either of the visualizers and the general GUI.
function draw() {
  background(255);
  
  fill(245);
  rect(0,0,width,visualizerHeight);

  if(!mode)
    mid.update();
  else
    clus.update();

    GUI();
}

//Define the GUI elements
function GUI()
{
    fill(244,67,54);
    rect(0,0,width,topBarHeight);
    rectMode(CENTER);
    fill(255);
    rect(width/2,topBarHeight/2,buttonDims[0],buttonDims[1],buttonDims[2]);
    fill(244,67,54);
    let offset = mode ? buttonDims[0]/4 : -buttonDims[0]/4;
    circle(width/2+offset,topBarHeight/2,buttonDims[1]);
    rectMode(CORNER);
    fill(255);
    textAlign(CENTER,CENTER);
    text("MidiVis",width/2-buttonDims[1]*2.5,topBarHeight/2*1.1);
    text("T-sne",width/2+buttonDims[1]*2.5,topBarHeight/2*1.1);
}

////////////////////////
//HELPER FUNCTIONS START
function unSelectAll()
{
  mid.unSelectAll();
}

function updateScores()
{
  mid.updateAllScores();
}

function orderMidis()
{
  mid.calculateScores();
}

function selectClusterSong(name)
{
  clus.unSelectAllPoints();
  clus.selectSong(name);
}
//HELPER FUNCTIONS END
//////////////////////

//Class to create a single song (MIDI file) visualization
class song
{
  //Initialize all the variables needed to make analysis, create visualizations and provide responsibity
  constructor(songName, midiFile, initialSizeX, initialSizeY)
  {
    this.name = songName;
    this.midiFile = midiFile;
    this.x = 10;
    this.y = 50;
    this.sizeX = initialSizeX;
    this.sizeY = initialSizeY;
    this.tempCount = Object.keys(this.midiFile).length;

    this.midiLong = [];
    this.midiCounts = [];

    this.midiDiffCounts = [];

    this.totalWidth;

    this.populateMidiLists();

    this.selected = false;
    this.score = 0;

    this.newX = this.x;
    this.newY = this.y;

    this.hoverDist = 100;
    this.dontDraw = false;

    this.buttonData = [[0.1,"select"],[1.1,"play"],[2.1,"delete"],[3.2,"download"]];

    //Calculations to make the midi visualization wrap around when tracks change.
    for (let track in this.midiFile)
      {
        let allNotes = this.midiFile[track].notes;
        if(allNotes.length == 0)
          {
            this.tempCount--;
          }
        }
    
    this.trackSize = this.sizeY/this.tempCount;
  }

  selectSong()
  {
    unSelectAll();
    this.selected = true;

    currSelection = this.midiLong;
    updateScores();
    orderMidis();
  }

  /////////////////
  //IMPORTANT: This methods are left empty on purpose. Calls to the Apollo Server will be done here.
  play()
  {

  }

  delete()
  {

  }

  download()
  {

  }
  //
  /////////////////

  //Make one read through the JSON file and store the info in memory, to save reading times when the system is running
  populateMidiLists()
  {
    this.totalWidth = 0;
    for (let key in this.midiFile)
      {
        let currNotes = this.midiFile[key].notes;
        let tempWidth = 0
        for (let i = 0; i<currNotes.length; i++)
          tempWidth += currNotes[i][3]
        if (this.totalWidth < tempWidth)
          this.totalWidth = tempWidth
      }
    let trackCount = 0
    for (let track in this.midiFile)
      {
        this.midiLong = this.midiLong.concat([int("777"+trackCount)]);
        this.midiCounts = this.midiCounts.concat([777,trackCount]);
        trackCount++;
        let allNotes = this.midiFile[track].notes;
        if(allNotes.length == 0)
          {
          }
        else if(allNotes.length != 0)
          {
            for (let i = 0; i<allNotes.length-2; i++)
              if (i%2==0)
              {
                let n2 = allNotes[i+1][3];
                let n3 = allNotes[i+2][3];
                let duration = (n2 + n3);
                this.midiLong = this.midiLong.concat(Array(duration).fill(allNotes[i][1]));
                this.midiCounts = this.midiCounts.concat([allNotes[i][1],duration]);
              }
          }
      }
  }

  changeCoords(newX, newY)
  {
    this.x = newX;
    this.newY = newY;
  }

  //Implements a smooth transition between positions in the track, for a nicer visualization experience.
  moveIfNotInPosition()
  {
    if (this.newY != this.y)
    {
      if (abs(this.newY-this.y) < 0.2)
        this.y = this.newY;
      else
        this.y += (this.newY - this.y)/5;
    }
  }

  changeXSize(newSize)
  {
    this.sizeX = newSize;
  }

  changeYSize(newSize)
  {
    this.sizeY = newSize;
    this.trackSize = this.sizeY/this.tempCount;
  }

  /*Class to draw a specific button.
  WARNING: This method has a functional paradigm rather than object-oriented. When the system is integrated with Apollo
  It is likely the buttons will have to be rewritten as a class.
  */
  drawButton(imageName, imageSize, sizeOffset, posMul, click, functionName)
  {
    image(imageName,this.x+(this.sizeX/2)+imageSize*0.9/2+imageSize*posMul,this.y+(this.sizeY/2),imageSize*sizeOffset,imageSize*sizeOffset);
    if (abs(mouseX-(this.x+(this.sizeX/2)+imageSize*0.9/2+imageSize*posMul))<imageSize*sizeOffset/2 && abs(mouseY-(this.y+(this.sizeY/2)))<imageSize*sizeOffset/2)
      {
        fill(255,60);
        circle(this.x+(this.sizeX/2)+imageSize*0.9/2+imageSize*posMul,this.y+(this.sizeY/2),imageSize*sizeOffset);
        if (click)
        {
          if(functionName=="select")
            this.selectSong();
          else if(functionName=="play")
            this.play();
          else if(functionName=="delete")
            this.delete();
          else if(functionName=="download")
            this.download();
        }
      }
  }


  drawMenu(On)
  {
    //Allow for smooth fades of the menu, for a better UX experience.
    if (On && !this.dontDraw)
    {
      this.hoverDist = this.hoverDist>0.2 ? this.hoverDist-10 : 0;
    }
    if (!On && !this.dontDraw)
    {
      this.hoverDist = abs(this.hoverDist-100)<0.2 ? 100 : this.hoverDist+5;
      
      if (this.hoverDist == 100)
      {
        this.dontDraw = true;
      }
    }
    
    if (!this.dontDraw)
    {
    fill(0,0,0,255*(1-(this.hoverDist/100)));
    tint(244,67,54,255*(1-(this.hoverDist/100)));
    imageMode(CENTER);
    let imageSize = this.sizeX > 400 ? 400/8 : this.sizeX/8;
    let sizeOffset = 0.7;
    this.drawButton(selectFile, imageSize, sizeOffset, this.buttonData[0][0], false, this.buttonData[0][1]);
    this.drawButton(playButton, imageSize, sizeOffset, this.buttonData[1][0], false, this.buttonData[1][1]);
    this.drawButton(trashCan, imageSize, sizeOffset, this.buttonData[2][0], false, this.buttonData[2][1]);
    this.drawButton(download, imageSize, sizeOffset, this.buttonData[3][0], false, this.buttonData[3][1]);
    }
  }

  onHover()
  {
    //Allow for smooth fades of the menu, for a better UX experience.
    if (mouseX-this.x<this.sizeX && mouseX-this.x>0 && mouseY-this.y<this.sizeY && mouseY-this.y>0)
      {
        fill(230,230,230,60);
        rect(this.x-this.sizeX*0.1,this.y-this.sizeY*0.2,this.sizeX*1.2,this.sizeY*1.4);
        this.dontDraw = false;
        this.drawMenu(true);
      }
      else
      {
        this.drawMenu(false);
      }
  }

  onClick()
  {
    let imageSize = this.sizeX/8;
    let sizeOffset = 0.7;
    this.drawButton(selectFile, imageSize, sizeOffset, this.buttonData[0][0], true, this.buttonData[0][1]);
    this.drawButton(playButton, imageSize, sizeOffset, this.buttonData[1][0], true, this.buttonData[1][1]);
    this.drawButton(trashCan, imageSize, sizeOffset, this.buttonData[2][0], true, this.buttonData[2][1]);
    this.drawButton(download, imageSize, sizeOffset, this.buttonData[3][0], true, this.buttonData[3][1]);
  }

  //Similarity-scoring algorithm (and the gist of the code)
  calculateScore()
  {
    this.score = 0;
    let idxs = [0]
    this.midiDiffCounts = [];

    //First, lets find where the track separations are in the file
    let tempSelection = currSelection.length >= this.midiLong.length ? this.midiLong : currSelection;
    for (let i = 0; i < tempSelection.length; i++)
    {
      
      if (this.midiLong[i] > 770)
      {
        idxs.push(i)
      }
    }


    for (let i = 0; i < idxs.length; i++)
    {
      //Then, use these track separation indexes to split the data into tracks for this file and the globally selected file
      let tempDiffCounts = [this.midiLong[idxs[i]],this.midiLong[idxs[i]]%777];
      let comp1;
      let comp2;
      if (i == idxs.length-1)
      {
      comp1 = this.midiLong.slice(idxs[i]+2,tempSelection.length)
      comp2 = currSelection.slice(idxs[i]+2,tempSelection.length)
      }
      else
      {
      comp1 = this.midiLong.slice(idxs[i]+2,idxs[i+1])
      comp2 = currSelection.slice(idxs[i]+2,idxs[i+1])
      } 

      /*Go through the notes and make the tick-by-tick comparison, logging onto tempDiffCounts all the info to present it later
      as transparent and red boxes in the visualization, marking where the MIDI files are not similar.
      The format is the one presented on the paper:
      [777,trackNumber,alpha 0 if similar,length of similarity,alpha 60 if not similar,length of similarity,...] 
      */
      let alpha = true;
      let currCount = 0
      for (let i = 0; i < comp1.length; i++)
      {
        if (i == 0)
        {
          alpha = comp1[i]==comp2[i] ? true : false;
        }
        currCount++;
        if (comp1[i]==comp2[i] && !alpha)
        {
          let val = alpha ? 0 : 60;
          tempDiffCounts.push(val, currCount);
          alpha = !alpha;
          this.score+=currCount;
          currCount = 0;
        }
        if (comp1[i]!=comp2[i] && alpha)
        {
          let val = alpha ? 0 : 60;
          tempDiffCounts.push(val, currCount);
          alpha = !alpha;
          currCount = 0;
          
        }
        if (i == comp1.length-1)
        {
          let val = alpha ? 0 : 60;
          tempDiffCounts.push(val, currCount);
        }
      }
      if(tempDiffCounts.length>=3)
        this.midiDiffCounts = this.midiDiffCounts.concat(tempDiffCounts);
    }
  }

  createMidiVis()
  {
    //Draw a red box behind if the track is the globally selected one
    if (this.selected)
    {
      fill(244,67,54,40);
      rect(this.x-this.sizeX*0.1,this.y-this.sizeY*0.2,this.sizeX*1.2,this.sizeY*1.4);
    }

    fill(40);
    text(this.name,this.x*3.58,this.y-5); //This is the only non fully responsive line in the entire code. Must be optimized.
    
    //Draw all the blue boxes representing the MIDI notes as presented in the paper.
    let trackCount = -1;
    let trackChange = 0;
    let count = 0;
    for (let i = 0; i< this.midiCounts.length-1; i++)
    {
      if (i%2==0)
      {
        if (this.midiCounts[i] == 777)
        {
          if (trackCount != 0)
              if(this.midiCounts[i-2]==777)
                continue;
          if (count < this.totalWidth && trackCount>=0)
            {
              fill(0,0,255,50);
              rect(this.x+count,this.y+(this.trackSize*trackCount),this.totalWidth/(this.totalWidth/this.sizeX)-count,this.trackSize);
            }
          trackCount++;
          count = 0;
        }
        else
        {
          strokeWeight(0);
          fill(0,0,255*(1-trackCount/Object.keys(this.midiFile).length),this.midiCounts[i]*2);
          let duration = this.midiCounts[i+1]/(this.totalWidth/this.sizeX);
          rect(this.x+count,this.y+(this.trackSize*trackCount),duration,this.trackSize);
          count += duration;
        }
      }
    }

    //Draw all the red boxes representing the dissimilarities between this file and the globally selected one
    //Note that if it is the globally selected track, it still draw boxes, but with total transparency as the
    //similarity is perfect.
    trackCount = -1;
    trackChange = 0;
    count = 0;
    for (let i = 0; i< this.midiDiffCounts.length-1; i++)
    {
      if (i%2==0)
      {
        if (this.midiDiffCounts[i] >= 777)
        {
          if (trackCount != 0)
              if(this.midiDiffCounts[i-2]>=777)
                continue;

          trackCount++;
          count = 0;
        }
        else
        {
          strokeWeight(0);
          fill(255,0,0,this.midiDiffCounts[i]);
          let duration = this.midiDiffCounts[i+1]/(this.totalWidth/this.sizeX);
          rect(this.x+count,this.y+(this.trackSize*trackCount),duration,this.trackSize);
          count += duration;
        }
      }
    }

    this.onHover();
    this.moveIfNotInPosition();
  }
}

//Class to handle all the different midi file single visualizers
class songVis{
  constructor(x, y, width, height, songs)
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.songs = songs;

    this.songArray = [];

    //Create all the midi file single objects
    for (let file in this.songs)
      this.songArray.push(new song(file,this.songs[file],400,82))
    
    this.songArray[0].selected = true;

    this.orderedNames = [];
    this.calculateScores();
  }

  //Get all the similarity algorithm scores, sort them and rearrange them in the visualization
  calculateScores()
  {
    this.orderedNames = [];
    let keyValuePairs = [];
    for (let i = 0; i < this.songArray.length; i++)
    {
      keyValuePairs.push([this.songArray[i].name, this.songArray[i].score]);
    }

    keyValuePairs.sort(function(first, second){
      return first[1] - second[1];
    });
    for (let i = 0; i < keyValuePairs.length; i++)
    {
      this.orderedNames.push(keyValuePairs[i][0]);
    }
  }
  
  //Draw all the necessary elements. This method also changes the tracks sizes and position responsively
  update()
  {
    let sectionheight = (visualizerHeight-topBarHeight*2)/this.songArray.length;

    for (let j = 0; j < this.orderedNames.length; j++)
      {
        for (let k = 0; k < this.songArray.length; k++)
        {
          if (this.songArray[k].name == this.orderedNames[j])
          {
            this.songArray[k].changeCoords(width*0.05,topBarHeight*2+sectionheight*j);
          }
        }
      }

    for (let i = 0; i < this.songArray.length; i++)
    {
      this.songArray[i].createMidiVis();
      this.songArray[i].changeXSize(width*0.9);

      this.songArray[i].changeYSize(sectionheight*0.7);

      this.songArray[i].changeCoords(width*0.05,topBarHeight*2+sectionheight*i);
    }
  }

  ////////////////////////
  //HELPER FUNCTIONS START
  unSelectAll()
  {
    for (let i = 0; i < this.songArray.length; i++)
    {
      this.songArray[i].selected = false;
    }
  }

  updateAllScores()
  {
    for (let i = 0; i < this.songArray.length; i++)
    {
      this.songArray[i].calculateScore();
    }
  }

  onClick()
  {
    for (let i = 0; i < this.songArray.length; i++)
    {
      this.songArray[i].onClick();
    }
  }
}
//HELPER FUNCTIONS END
////////////////////////

//Resize the canvas to allow responsibity
function windowResized() {
  resizeCanvas(windowWidth/2, windowHeight);
}


//Implements a Demo of the clustering visualizer
class cluster
{
  //Main Class
  constructor(songs)
  {
    this.songCoords = songs
    this.sizeX = 100;
    this.sizeY = 100;
    this.x = 0;
    this.y = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.sizeXMul = 1;
    this.sizeYMul = 1;
    this.pointSize = 30;
    this.allPoints = [];
    this.createPoints();

    this.selectedSong = "";

    this.imageSize = 30;

    this.buttonData = [[1.1,"play"],[2.1,"delete"],[3.2,"download"]];
  }

  //Helper class for responsiveness
  updateSizes()
  {
    this.sizeX = width*0.9;
    this.sizeY = height*0.9;
    this.x = width*0.05;
    this.y = height*0.05;
  }

  //Helper classes
  unSelectAllPoints()
  {
    for (let i = 0; i < this.allPoints.length; i++)
    {
      this.allPoints[i].selected = false;
    }
  }

  resetGraph()
  {
    this.offsetX = 0;
    this.offsetY = 0;
  }

  //Create all the data points based on the JSON file.
  //Eventually, the JSON file would be created by the Apollo backend.
  createPoints()
  {
    for (let songData in this.songCoords)
    {
      this.allPoints.push(new songPoint(this.songCoords[songData][0], this.songCoords[songData][1], this.pointSize, String(songData)));
    }
    this.allPoints[0].selected = true;
  }

  //Update all the elements in a responsive way and draw them.
  update()
  {
    this.updateSizes();

    fill(240);
    rect(this.x,this.y,this.sizeX,this.sizeY);
    strokeWeight(2);
    this.drawLines();
    strokeWeight(0);

    let zoomSizeX = this.sizeX*this.sizeXMul;
    let zoomSizeY = this.sizeY*this.sizeYMul;
    for (let i = 0; i < this.allPoints.length; i++)
    {

      this.allPoints[i].update(this.offsetX,this.x,zoomSizeX,this.offsetY,this.y,zoomSizeY,this.pointSize,this.sizeYMul);
    }

    this.drawAxes();

    this.drawTransport();

    this.drawWrapper();

  }

  //Calculate the distance between the globally selected file and the rest of the files
  //Draw flickering lights (maybe this is too distracting and the flicker should be taken out)
  //between the points, with widths related to the distance of the two files in the graph.
  drawLines()
  {
    let coords = [0,0];
    for (let i = 0; i < this.allPoints.length; i++)
    {
      if (this.allPoints[i].selected == true)
      {
        coords = [this.allPoints[i].x, this.allPoints[i].y];
      }
    }

    let farCoords = [0,0]
    let farCoordValue = 0;

    let zoomSizeX = this.sizeX*this.sizeXMul;
    let zoomSizeY = this.sizeY*this.sizeYMul;

    let tempcoordsX = this.offsetX+this.x+coords[0]*zoomSizeX/10;
    let tempcoordsY = this.offsetY+this.y+(zoomSizeY-coords[1]*zoomSizeY/10);

    for (let i = 0; i < this.allPoints.length; i++)
    {

      let tempX = this.offsetX+this.x+this.allPoints[i].x*zoomSizeX/10;
      let tempY = this.offsetY+this.y+(zoomSizeY-this.allPoints[i].y*zoomSizeY/10);
      

      if (this.calculateHyp([tempX,tempY],[tempcoordsX,tempcoordsY])> farCoordValue)
      {
        farCoords = [tempX,tempY];
        farCoordValue = this.calculateHyp([tempX,tempY],[tempcoordsX,tempcoordsY]);
      }
    }

    for (let i = 0; i < this.allPoints.length; i++)
    {
      strokeWeight(2);
  
      let tempX = this.offsetX+this.x+this.allPoints[i].x*zoomSizeX/10;
      let tempY = this.offsetY+this.y+(zoomSizeY-this.allPoints[i].y*zoomSizeY/10);

      let hyp = this.calculateHyp([tempX,tempY],[tempcoordsX,tempcoordsY]);

      strokeWeight(3-hyp/farCoordValue*3+random(0,0.6));
      stroke(0,0,255,random(190,255));
      line(tempX,tempY,tempcoordsX,tempcoordsY);
      strokeWeight(0);
    }
  }

  //Helper function
  calculateHyp(point1, point2)
  {

    return Math.sqrt((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)
  }

  //Draw the two axes on the sides, to provide a better UX experience
  drawAxes()
  {
    let zoomSizeX = this.sizeX*this.sizeXMul;
    let size = zoomSizeX/10;
    for (let i = 0; i < 200; i++)
    {
      //fill(0,0,255,230*(1-((i%20)/20)*0.5));
      let fillVal = i%2 ? 150 : 200;
      fill(0,0,255,fillVal);
      rect(-850+this.x+size*i+this.offsetX,this.y+this.sizeY-(this.sizeY*0.1)-(this.y*0.3),size,this.y*0.3);
      rect(this.x,-850+this.y+size*i+this.offsetY,this.x*0.3,size);
    }
  }

  //Draws borders so the points don't show up in the corners :P
  drawWrapper()
  {
    fill(255);
    rect(0,0,width,this.y);
    rect(0,0,this.x,height);
    rect(0,height-this.y,width,this.y);
    rect(width-this.x,0,this.x,height);
  }

  drawTransport()
  {

    fill(redColor);
    tint(244,67,54);
    tint(255);
    rect(this.x,this.y+this.sizeY-(this.sizeY*0.1),this.sizeX,this.sizeY*0.1);
    fill(255);
    this.drawButton(playButton, this.x+(this.sizeX/6+this.sizeX/3*0),this.y+this.sizeY-(this.sizeY*0.04), this.imageSize, this.buttonData[0][0], false, this.buttonData[0][1]);
    this.drawButton(trashCan, this.x+(this.sizeX/6+this.sizeX/3*1),this.y+this.sizeY-(this.sizeY*0.04),this.imageSize, this.buttonData[1][0], false, this.buttonData[1][1]);
    this.drawButton(download, this.x+(this.sizeX/6+this.sizeX/3*2),this.y+this.sizeY-(this.sizeY*0.04),this.imageSize, this.buttonData[2][0], false, this.buttonData[2][1]);
    fill(0);
    text(this.selectedSong, this.x+this.sizeX/2, this.y+this.sizeY-(this.sizeY*0.075));
  }

  /////////////////
  //IMPORTANT: This methods are left empty on purpose. Calls to the Apollo Server will be done here.
  play()
  {}

  delete()
  {}

  download()
  {}
  //
  /////////////////

  //Class to draw a specific button.
  drawButton(imageName, x, y, imageSize, posMul, click, functionName)
  {
    if (abs(mouseX-x)<imageSize/2 && abs(mouseY-y)<imageSize/2)
    {
      fill(255,60);
      circle(x,y,imageSize*1.2);
      if (click)
      {
        if(functionName=="play")
            this.play();
          else if(functionName=="delete")
            this.delete();
          else if(functionName=="download")
            this.download();
      }
    }
    image(imageName,x,y,imageSize,imageSize);

  }

  /////////////////
  //Mouse Interaction methods
  onMouseDrag()
  {
    this.offsetX += mouseX - pmouseX;
    this.offsetY += mouseY - pmouseY;
  }

  onMouseScroll(delta)
  {
    this.sizeXMul += delta*0.001;
    this.sizeYMul += delta*0.001;
  }

  selectSong(name)
  {
    this.selectedSong = name;
  }

  onClick()
  {
    let zoomSizeX = this.sizeX*this.sizeXMul;
    let zoomSizeY = this.sizeY*this.sizeYMul;
    for (let i = 0; i < this.allPoints.length; i++)
    {
      this.allPoints[i].onClick(this.offsetX,this.x,zoomSizeX,this.offsetY,this.y,zoomSizeY,this.pointSize,this.sizeYMul);
    }
  }
  //
  /////////////////
}

//Class to represent a single point in the graph
class songPoint
{
  constructor(x, y, initialSize, name)
  {
    this.x = x;
    this.y = y;
    this.size = initialSize;
    this.xOffset = 0;
    this.yOffset = 0;
    this.sizeMul = 1;
    this.name = name
    this.selected = false;
  }

  //Classes to update the position and size of the buttons to respond to window changes and user actions
  deltaX(offset)
  {
    this.xOffset += offset;
  }

  deltaY(offset)
  {
    this.yOffset += offset;
  }

  zoom(offset)
  {
    this.size += offset;
  }

  update(offsetX, x, zoomSizeX, offsetY, y, zoomSizeY, pointSize, sizeMul)
  {
    let tempX = offsetX+x+this.x*zoomSizeX/10;
    let tempY = offsetY+y+(zoomSizeY-this.y*zoomSizeY/10);
    
    fill(redColor);
    circle(tempX, tempY, pointSize*sizeMul)
    text(this.name,tempX,tempY+pointSize*sizeMul/1.5)

    if(abs(mouseX-tempX)<pointSize*sizeMul/2 && abs(mouseY-tempY)<pointSize*sizeMul/2)
    {
      fill(redColorAlpha);
      circle(tempX, tempY, pointSize*sizeMul*1.5);
    }

    if(this.selected)
    {
      fill(redColorAlpha);
      circle(tempX, tempY, pointSize*sizeMul*1.5);
    }
  }

  //Select specific song. Currently, it just selects it, but eventually it will pass the MIDI file info to the Apollo backend
  //So the user can interact with the song.
  onClick(offsetX, x, zoomSizeX, offsetY, y, zoomSizeY, pointSize, sizeMul)
  {
    let tempX = offsetX+x+this.x*zoomSizeX/10;
    let tempY = offsetY+y+(zoomSizeY-this.y*zoomSizeY/10);
    if(abs(mouseX-tempX)<pointSize*sizeMul/2 && abs(mouseY-tempY)<pointSize*sizeMul/2)
    {
    selectClusterSong(this.name);
    this.selected = true;
    }
  }
}