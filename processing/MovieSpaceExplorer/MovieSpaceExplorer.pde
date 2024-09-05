import processing.video.*;

Movie movie;
float endFrameMargin = 1.0 / 12.0;

void setup() {
  size(640, 480, P3D);
  
  if (movie != null) movie.dispose();
  movie = new Movie(this, "pennywise.mp4");
  movie.loop();
  movie.volume(0);
}

void draw() {
      if (movie.available()) {
        if(movie.time() > movie.duration() - endFrameMargin) movie.jump(0);
        movie.read();
        image(movie, 0, 0);  
      }
}
  
