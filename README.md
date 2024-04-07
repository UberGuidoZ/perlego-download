# Chrome extension to automate Perlego content downloads

> # NOTE: An active Perlego account is required!

For help installing this extension in chrome, please follow the steps indicated [here](https://dev.to/ben/how-to-install-chrome-extensions-manually-from-github-1612).

>*This code has been manually translated from Portuguese to English (US), originally from [GladistonXD](https://github.com/GladistonXD/perlego-download) and mistakes may have been introduced during this process. There are no guarantees of functionality with this code! It's likely there will be little to no updates as I am unsure how long I will be using this service. Some books may have specific bugs because I didn't take the time to test all the possibilities.*

You must first access the book normally before you can start the automation!<br>
Load it via the standard link: `https://ereader.perlego.com/1/book/(ID*)`

After completing the script, an HTML file should be generated. From this HTML file, it should be possible to print a PDF.

Since the PDF version does not scroll automatically, it is recommended to press the scrollwheel button on the mouse, then move the mouse down slightly, so the page will load automatically. If you do not have a scrollwheel (like a trackpad), you can also press the "Page Down" key to speed up the process.

It is very important to go to the end of the saved HTML file if you are going to print PDF since larger files will not load completely until they reach the end of the page. ePUB books can be translated into other languages directly in the generated HTML file.

If the file is so large that the browser cannot process it, you can manually edit the HTML file and save it into smaller parts to split up the process, or use another browser to open the HTML file. (Firefox may use less memory and work, though Edge is also Chromium-based now.)

> # New function to continue where you left off:
Now you can reload the page if it gets stuck, then just click again to start and continue where you left off. If you need to clear teh cache, there is a button for that too!

> # To use offline:
It is very important to convert the HTML to PDF or it will not be possible to use it offline. (The images have an expiration date.) To convert to PDF, simply open the HTML file, scroll to the bottom as mentioned above so ALL content is loaded, then use CTRL+P to print/save it to PDF. Chrome has this built in, as do most operating, but if not, you can install a free PDF printer.

> # Read the format descriptions to avoid browser crashes:
<p align="start">
<img src="https://github.com/UberGuidoZ/perlego-download/assets/57457139/1b8788dd-f3f6-444d-bfcb-832a3c631f24" alt="Description" width="50%" height="50%"/>
</p>

> # Need help? No guarantees but feel free to reach out.
