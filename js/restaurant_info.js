let restaurant;
let map;
let isFormsubmitted = false;
let isStatusOffline = false;
const statusFlag = document.getElementById('status-flag');
const statusFlagText = document.getElementById('status-flag-text');

// To fix issue when there is no Map

// document.addEventListener('DOMContentLoaded', (event) => {
//     fetchRestaurantFromURL();
// });

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        if (callback) {
            callback(null, self.restaurant);
        }
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        if (callback) {
            callback('No restaurant id in URL', null);
        }
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            if (callback) {
                callback(null, restaurant);
            }
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant, 'large');
    image.alt = restaurant.name;
    image.setAttribute('srcset',
        `${DBHelper.imageUrlForRestaurant(restaurant, 'small')} 320w,
         ${DBHelper.imageUrlForRestaurant(restaurant, 'medium')} 480w,
         ${DBHelper.imageUrlForRestaurant(restaurant, 'large')} 800w`
    );
    image.setAttribute('sizes', '(max-width: 320px) 280px, (max-width: 480px) 440px, 800px');

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();

    // fill reviews form
    fillReviewsFormHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review form HTML and add it
 to the webpage.
 */
fillReviewsFormHTML = () => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Leave review';
    container.appendChild(title);

    const form = document.createElement('form');

    const inputUserName = document.createElement('input');
    inputUserName.innerHTML = 'User name';
    inputUserName.id = 'user-name';
    inputUserName.placeholder = 'User name';
    inputUserName.required = true;
    form.appendChild(inputUserName);

    const inputUserRating = document.createElement('input');
    inputUserRating.innerHTML = 'User rating';
    inputUserRating.id = 'user-rating';
    inputUserRating.required = true;
    form.appendChild(inputUserRating);

    const comment = document.createElement('textarea');
    comment.rows = 4;
    comment.id = 'user-comment';
    comment.cols = 50;
    comment.required = true;
    form.appendChild(comment);

    const submit = document.createElement('input');
    submit.value = 'Rate restaurant';
    submit.type = 'submit';
    submit.setAttribute('aria-label', 'Submit restaurant review');
    submit.setAttribute('role', 'button');
    form.appendChild(submit);

    form.addEventListener('submit', (event) => {
        isFormsubmitted = true;

        if (navigator.onLine) {
            DBHelper.createRestaurantReview();
        } else {
            event.preventDefault();
            event.stopPropagation();
        }
    });
    container.appendChild(form);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');

    const header = document.createElement('div');
    const reviewContent = document.createElement('div');
    header.className = 'review-header';
    reviewContent.className = 'review-content';

    const name = document.createElement('p');
    name.className = 'review-name';
    name.innerHTML = review.name;
    header.appendChild(name);

    const date = document.createElement('p');
    date.className = 'review-date';
    date.innerHTML = formatDate(review.createdAt);
    header.appendChild(date);

    const rating = document.createElement('p');
    rating.className = 'review-rating';
    rating.innerHTML = `Rating: ${review.rating}`;
    reviewContent.appendChild(rating);

    const comments = document.createElement('p');
    comments.className = 'review-comments';
    comments.innerHTML = review.comments;
    reviewContent.appendChild(comments);

    li.appendChild(header);
    li.appendChild(reviewContent);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    li.setAttribute('aria-current', 'page');
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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

/**
 * This function used to format the date
 *
 * @param dateTimeStamp
 * @returns {string} date
 */
formatDate = (dateTimeStamp) => {
    const date = new Date(dateTimeStamp);
    const options = {year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleString('en-US', options);
};

/**
 * This function check if the form is valid
 *
 * @returns {boolean} valid
 */
isFormValid = () => {
    return document.getElementById('user-name').value
        && document.getElementById('user-rating').value
        && document.getElementById('user-comment').value;
};

/**
 * check the status of navigator (online/offline)
 */
setInterval(function () {
    if (navigator.onLine) {
        if (isStatusOffline) {
            statusFlag.style.backgroundColor = 'green';
            statusFlag.style.display = 'block';
            statusFlagText.textContent = 'You are online';

            setTimeout(function () {
                statusFlag.style.display = 'none';

                if (isFormValid() && isFormsubmitted) {
                    DBHelper.createRestaurantReview();
                }
            }, 500);

            isStatusOffline = false;
        }
    } else {
        statusFlag.style.backgroundColor = 'red';
        statusFlag.style.display = 'block';
        statusFlagText.textContent = 'You are offline !';

        isStatusOffline = true;
    }
}, 250);
