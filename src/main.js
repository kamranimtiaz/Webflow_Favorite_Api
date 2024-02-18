document.addEventListener("DOMContentLoaded", function() {

    const favoritesContainer = document.querySelector('#favorites-list-container');
    if (!favoritesContainer) {
  
      const memberstack = window.$memberstackDom;
      const jsonGroup = 'favorite';
      const favCountElement = document.querySelector('[data-field="favorite-count"]');
  
  
      // Function to fetch user favorites from MemberJSON
      async function fetchUserFavoritesFromMemberJSON() {
        const memberJson = await memberstack.getMemberJSON();
        if (memberJson && memberJson.data) {
          // Update local storage with new favorites
          localStorage.setItem('memberDataCache', JSON.stringify(memberJson));
  
          // Update the UI with new favorites
          updateFavoritesUI();
        }
      }
      // Detect User Login, Signup and Logout
      memberstack.onAuthChange((data) => {
        console.log(data);
        if (data) {
          // User Logged In
          // Clear local storage for favorites
          localStorage.removeItem('favoriteItems');
          localStorage.removeItem('memberDataCache');
  
          // Fetch new favorites from MemberJSON after user login
          // fetchUserFavoritesFromMemberJSON();
        }
      });
  
      // Fetch All Items
      async function fetchFavoritedItems(memberData) {
        const favoriteItemIds = memberData.favorite;
        console.log(favoriteItemIds);
        fetch('https://myapp.webflowxmemberstack.workers.dev/favourted-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(favoriteItemIds),
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            console.log('Success:', data);
            localStorage.setItem('favoriteItems', JSON.stringify(data));
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
  
  
      // Function to call your API and update Local Storage
      async function callApiAndUpdateStorage(memberData) {
        const favoriteItemIds = memberData;
        const tempArray = [favoriteItemIds]
        console.log(favoriteItemIds)
        fetch('https://myapp.webflowxmemberstack.workers.dev/favourted-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tempArray),
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            console.log('Success:', data);
            data.forEach((favItem) => {
              console.log(favItem);
            })
            const favLocalStorage = JSON.parse(localStorage.getItem('favoriteItems')) || [];
            favLocalStorage.push(...data);
            localStorage.setItem('favoriteItems', JSON.stringify(favLocalStorage));
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
  
      // Function to update button visibility and state
      function updateButtonState(button) {
        const itemId = button.getAttribute('ms-code-favorite-child');
        const memberDataCache = JSON.parse(localStorage.getItem('memberDataCache')) || { data: {} };
  
        const savedItems = memberDataCache.data && memberDataCache.data[jsonGroup] ? memberDataCache.data[jsonGroup] : [];
        const isItemFavorited = savedItems.includes(itemId);
  
        if (isItemFavorited) {
          button.classList.add('is-favorited');
        } else {
          button.classList.remove('is-favorited');
        }
      }
  
      // Function to toggle favorite status
      function toggleFavoriteStatus(button) {
        const itemId = button.getAttribute('ms-code-favorite-child');
        let memberDataCache = JSON.parse(localStorage.getItem('memberDataCache')) || { data: {} };
        let favoritedItemsCache = JSON.parse(localStorage.getItem('favoriteItems')) || [];
  
        if (!memberDataCache.data[jsonGroup]) {
          memberDataCache.data[jsonGroup] = [];
        }
        const isItemFavorited = memberDataCache.data[jsonGroup].includes(itemId);
  
        // Optimistic UI update
        if (isItemFavorited) {
          button.classList.remove('is-favorited');
          console.log(itemId);
          memberDataCache.data[jsonGroup] = memberDataCache.data[jsonGroup].filter(item => item !== itemId);
          favoritedItemsCache = favoritedItemsCache.filter(item => item['item-id'] !== itemId);
          const favoriteCount = memberDataCache.data[jsonGroup].length;
          favCountElement.textContent = favoriteCount;
  
        } else {
          button.classList.add('is-favorited');
          memberDataCache.data[jsonGroup].push(itemId);
          callApiAndUpdateStorage(itemId)
          const favoriteCount = memberDataCache.data[jsonGroup].length;
          favCountElement.textContent = favoriteCount;
        }
  
        // Update local storage cache
        localStorage.setItem('memberDataCache', JSON.stringify(memberDataCache));
        localStorage.setItem('favoriteItems', JSON.stringify(favoritedItemsCache));
        // Update memberstack in the background
        memberstack.updateMemberJSON({ json: memberDataCache.data })
          .catch(error => {
            console.error('Error:', error);
            // Revert UI changes in case of error
            // Optionally handle UI revert logic here
          });
      }
  
      // When the page loads, fetch member data once and update buttons
      memberstack.getCurrentMember().then(async ({ data }) => {
        if (data) {
          if (!localStorage.getItem('memberDataCache') || JSON.parse(localStorage.getItem('memberDataCache')).data == null) {
            const memberJson = await memberstack.getMemberJSON();
            console.log(memberJson)
            if (memberJson.data == null) {
              await memberstack.updateMemberJSON({ json: { "favorite": [] } });
            }
            favCountElement.textContent = memberJson.data[jsonGroup].length;
            // Cache member data in local storage 
            fetchFavoritedItems(memberJson.data);
            localStorage.setItem('memberDataCache', JSON.stringify(memberJson));
          } else {
            favCountElement.textContent = JSON.parse(localStorage.getItem('memberDataCache')).data.favorite.length;
          }
          const favoriteButtons = document.querySelectorAll('[ms-code-favorite-child]');
  
          // Update state of all favorite buttons
          favoriteButtons.forEach(button => {
            updateButtonState(button);
          });
  
          // Add event listener for favorite buttons
          favoriteButtons.forEach(button => {
            button.addEventListener('click', function(event) {
              event.preventDefault();
              toggleFavoriteStatus(button);
            });
          });
  
        } else {
          // Handle non-logged in users
          console.log("User Not Logged in")
        }
      });
    }
  
  });
  