/*
* CSCI 5828 - Spring 2018
* Homework 3
* Brandon Boylan-Peck
* 3/16/2018
*/

var fs 				= require('fs');
const EventEmitter 	= require('events');
var args      		= process.argv.slice(2);
var folder    		= args[0];
var instances 		= 0;
var finalSize 		= 0;

// Define my own event listener
const myEmitter = new EventEmitter();

// if "all_done" is emitted, add the size sent to the total
// and reduce "instances" by 1
// finally, if no more instances, you can print out the values.
myEmitter.on('all_done', (size) => {
	instances = instances - 1;
	finalSize = finalSize + size;
	if(instances === 0){
		console.log("Total size:", finalSize);
	}
});

// whenever we enter a new directory, add 1 "instance"
// this is used to keep track of all the asychronus stuff.
myEmitter.on('new_directory', () => {
	instances = instances + 1;
})

// make sure input folder was defined.
if (folder === undefined) {
	console.log("Usage: node hw2.js <path>");
	console.log("Note: if any folders have a space in them, wrap the entire path in \"\".");
	return;
}

// Make sure there's a / at the end so it can parse the folder correctly.
if (folder[-1] != '/') {
	folder = folder + '/';
}

// Used from in class example. Whenever a directory is done, print the size
// Only now, this function also emits a 
var all_done = function(size) {
	console.log("Directory size:", size);
	myEmitter.emit('all_done', (size));
}

// the only change made here, was the addition of the "prefix" variable
// That was only added to handle the different folders.
var handleFile = function(stats, i, filenames, total, prefix) {
	if (i === filenames.length - 1) {
		all_done(total + stats.size);
	} else {
		processFile(i+1, filenames, total+stats.size, prefix);
	}
}

// Several changes were made here to add reading folders.
// first, the prefix parameter was added to handle different folders.
var handleDir = function(i, filenames, total, prefix) {
	// First, we make a "name" that will be the new folder we enter
	var name = prefix + filenames[i] + '/';
	// Next, we emit a "new_directory" signal to tell our event listener
	myEmitter.emit('new_directory');
	// Then we use the slightly modified "read directory" code to read the next directory.
	fs.readdir(name, function(err, filenames) {
		if (err) throw err;
		if(filenames.length === 0){
			all_done(0);
		} else {
			processFile(0, filenames, 0, name);
		}
	});
	// and finally, this part remains the same. minus the "prefix" change.
	if (i === filenames.length - 1) {
		all_done(total);
	} else {
	processFile(i+1, filenames, total, prefix);
	}
}

// Process file only had minor changes. Prefixes were added,
// and the name is modified to include the prefix to handle folders.
var processFile = function(i, filenames, total, prefix) {
  var name = prefix+filenames[i]+'/';
  fs.stat(name, function(err, stats) {
    if (err) throw err;
    if (stats.isFile()) {
      handleFile(stats, i, filenames, total, prefix);
    } else {
      handleDir(i, filenames, total, prefix);
    }
  });
}

// Here, we emit that we're starting a new directory, since we're reading the first directory.
myEmitter.emit('new_directory');

// the only changes to this code, were to use the input "folder"
// and to handle if there are 0 items in the folder.
fs.readdir(folder, function(err, filenames) {
  if (err) throw err;
  //console.log("Number of Directory Entries:", filenames.length)
  if(filenames.length === 0){
    all_done(0);
  } else {
    processFile(0, filenames, 0, folder);
  }
});
