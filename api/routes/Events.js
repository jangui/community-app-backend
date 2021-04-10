const router = require('express').Router();
let Event = require('../models/Event.model');

// query events from start index to offset
// s: start index (how many we skip)
// l: offset from start
// search: optional. used to filted events
router.route('/query/').post( async (req, res) => {
    const s = parseInt(req.body.skip);
    if (typeof s === 'undefined') { return res.json("error: no start index"); }
    const l = parseInt(req.body.limit);
    if (typeof l === 'undefined') { return res.json("error: no offset index"); }
    search = req.body.search;
    if (typeof search === 'undefined') { search = ""; }

    try {
        let events = await Event.find(
        {
            // if search specified filter by search
            $or:[
                {name: {"$regex": search, "$options": "i"}},
                {city: {"$regex": search, "$options": "i"}},
                {country: {"$regex": search, "$options": "i"}},
            ],
        }
        ).sort({start: -1}
        ).skip(s).limit(l);
        return res.json(events);

    } catch(err) {
        return res.status(400).json('Error: ' + err);
  }
});

// add event
router.route('/add').post( async (req, res) => {
    const name = req.body.name;
    const start = Date.parse(req.body.start);
    const end = Date.parse(req.body.end);
    const city = req.body.city;
    const country = req.body.country;
    const capacity = req.body.capacity;


    const newEvent = new Event({name, start, end, city, country, capacity});

    try {
        let response = await newEvent.save(function(err,newDoc) {
            if (err) { return res.status(400).json('Error: ' + err); }
            return res.json(`Event '${name}' added! ID: ${newDoc.id}`);
        });
    } catch(err) {
        return res.status(400).json('Error: ' + err);
    }
});

// find event by id
router.route('/:id').get( async (req, res) => {
    try {
        let eventDoc = await Event.findById(req.params.id);
        return res.json(eventDoc)
    } catch(err) {
        return res.status(400).json('Error: ' + err);
    }
});

// delete event by id
router.route('/:id').delete( async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    return res.json("event deleted")
  } catch(err) {
    return res.status(400).json('Error: ' + err);
  }
});

// update event
router.route('/update/:id').post( async (req, res) => {
  try {
    let eventDoc = await Event.findById(req.params.id);
    eventDoc.name = req.body.name;
    eventDoc.start = Date.parse(req.body.start);
    eventDoc.end = Date.parse(req.body.end);
    eventDoc.city = req.body.city;
    eventDoc.county = req.body.country;
    eventDoc.capacity = req.body.capacity;

    try {
      let response = await eventDoc.save();
      return res.json(`Event '${eventDoc.name}' updated!`);
    } catch(err) {
      return res.status(400).json('Error: ' + err);
    }
  } catch(err) {
    return res.status(400).json('Error: ' + err);
  }
});

module.exports = router;
