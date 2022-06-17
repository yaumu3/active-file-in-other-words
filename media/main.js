(function () {
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'refresh':
                {
                    refreshView(message.data);
                    break;
                }

        }
    });

    /**
     * @param {{description: string}} data
     */
    function refreshView(data) {
        let app = document.querySelector('#app');
        if (!app) { return; }
        app.innerHTML = data.description;
    }
}());
