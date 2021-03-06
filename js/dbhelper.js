/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Restaurant reviews URL.
     */
    static get REVIEWS_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/reviews`;
    }

    /**
     * Open indexedDB database and create an object to store restaurants
     * each object of the database has a key. It's restaurant id.
     *
     * @returns indexedDB promise
     */
    static openIDB() {
        if (!('indexedDB' in window)) {
            console.log('This browser does not support IndexedDB');
            return;
        }

        return idb.open('mws-restaurant-db', 1, upgradeDB => {
            upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
        });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        const dbPromise = DBHelper.openIDB();

        dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantsStore = tx.objectStore('restaurants');
            return restaurantsStore.getAll();
        }).then(restaurants => {
            if (restaurants && restaurants.length !== 0) {
                callback(null, restaurants);
            } else {
                let xhr = new XMLHttpRequest();
                xhr.open('GET', DBHelper.DATABASE_URL);
                xhr.onload = () => {
                    if (xhr.status === 200) { // Got a success response from server!
                        const restaurants = JSON.parse(xhr.responseText);

                        dbPromise.then(db => {
                            const tx = db.transaction('restaurants', 'readwrite');
                            const restaurantsStore = tx.objectStore('restaurants');

                            restaurants.forEach(restaurant => restaurantsStore.put(restaurant));

                            return tx.complete;
                        }).then(() => {
                            console.log("Added with success!!");
                        });

                        callback(null, restaurants);
                    } else { // Oops!. Got an error from server.
                        const error = (`Request failed. Returned status of ${xhr.status}`);
                        callback(error, null);
                    }
                };
                xhr.send();
            }
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let restaurant = restaurants.find(r => r.id == id);

                if (restaurant) { // Got the restaurant
                    DBHelper.fetchRestaurantReviewsById(id, restaurant, callback);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch a restaurant reviews by its ID.
     */
    static fetchRestaurantReviewsById(id, restaurant, callback) {
        let xhr = new XMLHttpRequest();
        const params = '?restaurant_id=' + id;

        xhr.open('GET', DBHelper.REVIEWS_URL + params, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = () => {
            if (xhr.status === 200) {
                restaurant.reviews = JSON.parse(xhr.responseText);

                callback(null, restaurant);
            } else { // Oops!. Got an error from server.
                console.error(`Request failed. Returned status of ${xhr.status}`);
                callback('Restaurant reviews does not exist', null);
            }
        };
        xhr.send();
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type === cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood === neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine !== 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type === cuisine);
                }
                if (neighborhood !== 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood === neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant, resolution) {
        if (restaurant.photograph) {
            return (`/destImg/${restaurant.photograph}_${resolution}.jpg`);
        } else {
            return (`/destImg/default_${resolution}.jpg`);
        }
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

    static createRestaurantReview() {
        let xhr = new XMLHttpRequest();
        const params = 'restaurant_id=' + DBHelper.getParameterByName('id')
            + '&name=' + document.getElementById('user-name').value
            + '&rating=' + document.getElementById('user-rating').value
            + '&comments=' + document.getElementById('user-comment').value;

        xhr.open('POST', DBHelper.REVIEWS_URL);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = () => {
            if (xhr.status === 201) {
                console.log("Added with success!!");
                location.reload();
            } else { // Oops!. Got an error from server.
                console.error(`Request failed. Returned status of ${xhr.status}`);
            }
        };

        xhr.send(params);
    }

    /**
     * Get a parameter by name from page URL.
     */
    static getParameterByName(name, url) {
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };
}
