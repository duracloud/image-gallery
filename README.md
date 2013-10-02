image-gallery
=============

Project which provides an image gallery viewer for images within a DuraCloud space.

This image gallery is designed to be an easily deployable self contained "app" for viewing images stored within DuraCloud from the convenience of your browser (desktop or mobile browser).  The image gallery allows you to organize your images into multiple "collections" within a DuraCloud space and will then automatically display thumbnails of a image collection in a grid view.  Each image in the thumbnail display will have its name presented with it.  When a thumbnail is clicked an enlarged version of the thumbnail will be shown in the foreground with navigation controls for viewing the previous and next image in the collection (swipe navigation for mobile devices).  When viewing the large image the viewer provides the ability to zoom the image in and out simply by scrolling and panning around the image by moving your mouse.

The role-based access controls of DuraCloud are applied to viewing images within spaces, to ensure images are only viewed by authorized users. Spaces which are set to public access will be available for viewing through the image gallery without the need to provide credentials.

The image gallery is comprised of only html, javascript, and css files.  It is completely browser based and self contained.  It uses some of the latest web development technologies including HTML5, hardware accelerated CSS3 transitions and animations, responsive design to recognize the screen resolution being displayed on and adjust the layout of the components accordingly (desktop and mobile friendly using Bootstrap), and jQuery javascript library.

More info available here:
https://wiki.duraspace.org/display/DURACLOUD/DuraCloud+Image+Gallery