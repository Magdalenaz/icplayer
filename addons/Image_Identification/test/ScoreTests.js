TestCase("Score", {
    setUp: function() {
        this.presenter = AddonImage_Identification_create();
    },

    'test SelectionCorrect checked and item selected': function() {
        this.presenter.configuration = {
            shouldBeSelected: true,
            isSelected: true
        };

        var score = this.presenter.getScore();
        var error = this.presenter.getErrorCount();

        assertEquals(1, score);
        assertEquals(0, error);
    },

    'test SelectionCorrect checked and item not selected': function() {
        this.presenter.configuration = {
            shouldBeSelected: true,
            isSelected: false
        };

        var score = this.presenter.getScore();
        var error = this.presenter.getErrorCount();

        assertEquals(0, score);
        assertEquals(0, error);
    },

    'test SelectionCorrect not checked and item selected': function() {
        this.presenter.configuration = {
            shouldBeSelected: false,
            isSelected: true
        };

        var score = this.presenter.getScore();
        var error = this.presenter.getErrorCount();

        assertEquals(0, score);
        assertEquals(1, error);
    },

    'test SelectionCorrect not checked and item not selected': function() {
        this.presenter.configuration = {
            shouldBeSelected: false,
            isSelected: false
        };

        var score = this.presenter.getScore();
        var error = this.presenter.getErrorCount();

        assertEquals(0, score);
        assertEquals(0, error);
    },

    'test SelectionCorrect checked, max score should be 1': function() {
        this.presenter.configuration = {
            shouldBeSelected: true
        };

        var score = this.presenter.getMaxScore();

        assertEquals(1, score);
    },

    'test SelectionCorrect not checked, max score should be 0': function() {
        this.presenter.configuration = {
            shouldBeSelected: false
        };

        var score = this.presenter.getMaxScore();

        assertEquals(0, score);
    }
});