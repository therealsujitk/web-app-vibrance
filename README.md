# Vibrance

![Heroku](https://pyheroku-badge.herokuapp.com/?app=vitvibrance) ![License](https://img.shields.io/badge/license-MIT-blue.svg)

A web application for VIT Chennai's cultural festival with a built-in Rest API for easy access of data on other platforms and an admin panel to make life easier for the event organisers.

> **Disclaimer:** This application is still under development and is not currently installable. However you can still test out the API using the link attached to this repository.

## Requirements

- Node.js 10+
- MySQL 5.6+ or MariaDB 10.0.5+

## Dependencies

Install the necessary dependencies by running either of the commands below.

Using **npm**:
```sh
$ npm install
```

Using **yarn**:
```sh
$ yarn install
```

## Usage

**Note:** Before running either of the commands below to start the server, install the necessary dependencies by running either of the commands above.

Using **npm**:
```sh
$ npm run start
```

Using **yarn**:
```sh
$ yarn run start
```

**Note:** `start` should be replaced with `dev` if not in a production environment.

## API

### About

The endpoint **`/api/about.json`** will return an object similar to the one shown below.
```json
{
    "title": "Vibrance 2020",
    "description": "The official website for VIT Chennai's cultural festival.",
    "opening_date": "2020-02-06",
    "opening_time": "09:00",
    "social": {
        "facebook": "VibranceVIT",
        "instagram": "vibrancevit",
        "twitter": "VibranceVIT",
        "youtube": "vibrancevit"
    }
}
```

### Days

The endpoint **`/api/days.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "day_string": "Day 1",
        "date_string": "2020-02-06"
    },
    "1": {
        "day_string": "Day 2",
        "date_string": "2020-02-07"
    },
    "2": {
        "day_string": "Day 3",
        "date_string": "2020-02-08"
    }
}
```

### Categories

The endpoint **`/api/categories.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "category": "Code-Y-Gen",
        "category_type": "Chapter",
        "image": "http://localhost/public/assets/categories/code-y-gen.png"
    },
    "1": {
        "category": "Dramatics Club",
        "category_type": "Club",
        "image": "http://localhost/public/assets/categories/dramatics-club.png"
    }
}
```

#### Parameters

- **`?type=`**
    - **`club`** - Returns an object of all clubs.
    - **`chapter`** - Returns an object of all chapters.

To get an object with multiple category types, combine them with **`&`**. For example: `/api/categories.json?type=club&type=chapter`.

#### Examples

The request `/api/categories.json?type=club` will return an object similar to the one shown below.
```json
{
    "0": {
        "category": "Dramatics Club",
        "image": "http://localhost/public/assets/categories/dramatics-club.png"
    },
    "1": {
        "category": "Photography Club",
        "image": "http://localhost/public/assets/categories/photography-club.png"
    }
}
```

### Venues

The endpoint **`/api/venues.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "venue": "Academic Block 1",
        "rooms": [
            "101",
            "209",
            "206",
            "301"
        ]
    },
    "1": {
        "venue": "Online",
        "rooms": []
    }
}
```

### Events

The endpoint **`/api/events.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "title": "Anime",
        "description": "",
        "category_image": "http://localhost/public/assets/categories/socrates-club.png",
        "event_image": "http://localhost/public/assets/events/anime.png",
        "start_time": "10:00",
        "end_time": "11:00",
        "members": "1",
        "entry_fee": 10,
        "day_string": "Day 1",
        "category": "Socrates Club",
        "venue": "Academic Block 1",
        "room": "301"
    }
}
```

#### Parameters

- **`?day=`**
    - `day-string` - Returns an object with events of that day.
- **`?category=`**
    - `category-string` - Returns an object with events of that category.
- **`?venue=`**
    - `venue-string` - Returns an object with events in that venue.
- **`?room=`**
    - `room-string` - Returns an object with events in that room.
- **`?offset=`**
    - `offset-value` - Returns an object starting from that offset value. For performance reasons, only 40 events are loaded per request.

To use multiple paramaters, combine them with **`&`**. For example: `/api/events.json?day=day 1&category=club`. The same parameter can also be used multiple times.

### Pro Shows

The endpoint **`/api/pro_shows.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "description": "",
        "day_string": "Day 1",
        "venue": "Academic Block 1",
        "room": "101",
        "image": "http://localhost/public/assets/pro-shows/day-1.png"
    },
    "1": {
        "description": "",
        "day_string": "Day 2",
        "venue": "Academic Block 2",
        "room": "ACT Lab",
        "image": "http://localhost/public/assets/pro-shows/day-2.png"
    }
}
```

### Merchandise

The endpoint **`/api/merchandise.json`** will return an object similar to the one shown below.
```json
{
    "0": {
        "title": "Hoodie",
        "image": "http://localhost/public/assets/merch/hoodie.png",
        "cost": "500"
    },
    "1": {
        "title": "Wrist Band",
        "image": "http://localhost/public/assets/merch/wrist-band.png",
        "cost": "30"
    }
}
```
