import processing.video.*;
import peasy.PeasyCam;

Movie movie;
PeasyCam cam;
PShape shp;
boolean firstRun = true;
float endFrameMargin = 1.0 / 12.0;

void setup() {
  size(640, 480, P3D);
  
  cam = new PeasyCam(this, 400);

  if (movie != null) movie.dispose();
  movie = new Movie(this, "pennywise.mp4");
  movie.loop();
  movie.volume(0);
  
  shp = createShape();
  
  shp.beginShape();
  shp.vertex(0, 0);
  shp.vertex(100, 100);
  shp.vertex(200, 100);
  shp.vertex(0, 100);
  shp.endShape(CLOSE);  
}

void draw() {
  background(0);
  
  if (movie.available()) {
    //if (movie.time() > movie.duration() - endFrameMargin) movie.jump(0);
    movie.read();
  }

  image(movie, -width/2, -height/2);  
  
  translate(0, 0, 10);
  shape(shp);
}
  
