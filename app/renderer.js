const u = require('umbrellajs');

const self = module.exports = {
    currentPage: '',
    pageDirectory: 'pages',
    bindNavigation: (navigationSelector) => {
        return new Promise((resolve, reject) => {
            u(navigationSelector).on('click', (e) => {
                e.preventDefault();
                const element = u(e.target);
                const pageName = element.data('page');
                if (pageName === self.currentPage) {
                    return;
                }
                self.navigate(pageName);
            });
            resolve();
        });
    },
    navigate: (pageName, closeNavigationPane = true) => {
        try {
            const pageCode = require('./' + self.pageDirectory + '/' + pageName);
            u('.cognitive-content').each(page => {
                const pageElement = u(page);
                if (pageElement.data('page') === pageName) {
                    pageElement.addClass('show');
                } else {
                    pageElement.removeClass('show');
                }
            });
            if (self.currentPage !== '') {
                const currentPage = require('./' + self.pageDirectory + '/' + self.currentPage);
                currentPage.deInit();
            }
            pageCode.init();
            self.currentPage = pageName;
            if (closeNavigationPane) {
                // close navigation panel hack :)
                u('.mdl-layout__drawer-button').trigger('click');
            }
        } catch {
            console.error('Page: ' + pageName + ' not found.');
        }
    }
};