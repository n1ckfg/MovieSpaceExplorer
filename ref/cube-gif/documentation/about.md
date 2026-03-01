# About cube.gif

*[cube.gif][site]* is an experiment visualizing gifs as 3D cubes by encoding animation time as another spatial dimension. We can then slice the gif cube using a plane, projecting the data back into two dimensions and producing images that capture multiple frames of the original animation.

# Concept
Consider a 12 frame gif that fades from red to blue, where the top right corner of each frame is a solid color and the bottom left corner is white.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/example-start.gif)

Each image already has 2 spatial dimensions: x and y for pixel coordinates. The third dimension of the data is time.

To encode time as another spatial dimension, imagine creating a 1x1x1 cube and drawing the first frame of the animation on the front face of the cube. Now extrude the pixels of the front face to create a volume. After moving 1/12th of way through the cube, start sampling from the next frame of the animation. Continue this process through the entire cube. This produces a 3D volume of pixel data, 1/12 for each frame of the animation.

Here's what that cube looks like for the above gif.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube.png)

The front left face shows the first frame of the gif.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-front.png)

The right side of the cube shows the rightmost column of pixels for each frame in the animation (note the 12 distinct bands.)

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-side.png)

While the top of the cube shows the top row of pixels for each frame in the animation.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-top.png)

## Slicing
These gif cubes are pretty cool, but things get even more interesting if we then project the cube back into two dimensions. To do this, imagine slicing through the cube. Here's an example slice through the corner of the cube, with the sliced off piece of the cube removed.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-slice.png)

Here's the front view of the sliced cube.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-slice-front.png)

Side view.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-slice-side.png)

And top view.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-slice-top.png)

The face of the slice is just another surface, which we can view as an image. Here's the image produced by the shown slice.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/cube-slice-image.png)

This single image samples from multiple frames of the original animation, as well as multiple positions within each frame. 

We can slice the gif cube at any angle like this to create interesting new 3D shapes and 2D slice images.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/slice-angled.gif)


# Usage
*cube.gif* works best on a computer with a mouse. The app works fine on most devices, but the controls are difficult to use on a phone touchscreen.

## Camera Movement
Click and drag anywhere outside the cube to rotate the camera about. Use the mouse-wheel to zoom in and out, and hold the right mouse button to pan about.

The buttons in the top left corner switch between the standard camera views.

## Guides
![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/guides.png)

* The gray lines outlines the gif cube volume.
* The black lines shows the the slice plane. The solid gray box shows the location of the top, left side of the slice plane when sampling images.
* The red, green, and blue are the axes. Red and green map roughly to x and y in single image from the gif, while the blue axis maps to animation time. The axis is positioned in the lower left corner of the image, at the first frame.


## Slicing Plane Movement
The slicing plane can be freely moved about to explore the data. 

Translation moves the slicing plane. Use the `W` key or the `Translate` button to switch to translation mode. Note that when you move the slice plane off the cube, areas outside the slice are colored gray and are not included in the output slice image.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/slice-translation.gif)

Rotation adjusts the angle of the slicing plane. Use the `E` key or the `Rotate` button to switch to rotation mode.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/slice-rotation.gif)

Scaling adjusts the size of the sample plane. 

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/slice-scale.gif)

To understand how scaling works, imagine the slicing plane is a ten by ten grid of color sensors, like a super low res camera sensor. Normally, all the sensors in the grid are evenly spaced apart. But when we scale the plane, we adjust the distance between each of these sensors. Scale the plane's width in half, and we still have 10 sensors in each row, but now the distance between all of them is cut in half and we end up being able to detect more detail horizontal because we are sampling points closer together.

Scaling also interacts with `Sample Width` and `Sample Height`. Scale determines the size of the image sensor plane, while `Sample Width` and `Sample Height` determine the number of columns and rows of sensors on this plane. Combined, this offers a lot of control over the output image, but can also be somewhat confusing. To avoid distortion, make sure that the aspect ratio of the plane matches the aspect ratio of the sampling.


## Sample Size
`Sample Width` and `Sample Height` control the size of the output slice image. As discussed above in scaling, you can think of these as the number of points (pixels) sampled on the slicing plane.

Decreasing the number of samples lowers the resolution of the output image.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/low-res-slice.png)

While increasing the number of samples increases the resolution.

![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/high-res-slice.png)

You can also adjust the width and height separately to get different aspect ratio output images.


![](https://raw.githubusercontent.com/mattbierner/cube-gif/gh-pages/documentation/images/wide-res-slice.png)




[site]: https://mattbierner.github.io/cube-gif/