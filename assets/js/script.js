// ? Grab references to the important DOM elements.
const closeBtnEl = $('#close-btn');
const taskFormEl = $('#task-form');
const taskNameInputEl = $('#task-name-input');
const taskDescriptionInputEl = $('#task-description-input');
const taskDateInputEl = $('#taskDueDate');

function readTasksFromStorage() {
    // ? Retrieve tasks from localStorage and parse the JSON to an array.
    // ? We use `let` here because there is a chance that there are no tasks in localStorage (which means the taskList variable will be equal to `null`) and we will need it to be initialized to an empty array.
    let taskList = JSON.parse(localStorage.getItem("tasks"));

    // ? If no taks were retrieved from localStorage, assign taskLikst to a new empty array to push to later.
    if (!taskList) {
        taskList = [];
    }
    // ? Return the taskList array either empty or with data in it whichever it was determined to be by the logic right above.
    return taskList;
}


// Function to generate a unique task id
function generateTaskId() {
    // ? Here we use a Web API called `crypto` to generate a random id for our tasks. This is a unique identifier that we can use to find the task in the array. `crypto` is a built-in module that we can use in the browser and Nodejs.
    return crypto.randomUUID();
}

// Function to create a task card
function createTaskCard(task) {
    const taskCard = $('<div>')
        .addClass('card draggable my-3')
        .attr('data-task-id', task.id);
    const cardHeader = $('<div>').addClass('card-header h4').text(task.name);
    const cardBody = $('<div>').addClass('card-body');
    const cardDescription = $('<p>').addClass('card-text').text(task.description);
    const cardDueDate = $('<p>').addClass('card-text').text(task.dueDate);
    const cardDeleteBtn = $('<button>')
        .addClass('btn btn-danger delete')
        .text('Delete')
        .attr('data-task-id', task.id);
    cardDeleteBtn.on('click', handleDeleteTask);

    if (task.dueDate && task.status !== 'done') {
        const now = dayjs();
        const taskDueDate = dayjs(task.dueDate, 'DD/MM/YYYY');

        // ? If the task is due today, make the card yellow. If it is overdue, make it red.
        if (now.isSame(taskDueDate, 'day')) {
            taskCard.addClass('bg-warning text-white');
        } else if (now.isAfter(taskDueDate)) {
            taskCard.addClass('bg-danger text-white');
            cardDeleteBtn.addClass('border-light');
        }
    }
    // ? Gather all the elements created above and append them to the correct elements.
    cardBody.append(cardDescription, cardDueDate, cardDeleteBtn);
    taskCard.append(cardHeader, cardBody);

    // ? Return the card so it can be appended to the correct lane.
    return taskCard;

}

// Function to render the task list and make cards draggable
function renderTaskList() {
    console.log('renderTaskList');
    const taskList = readTasksFromStorage();

    // ? Empty existing task cards out of the lanes
    const todoList = $('#todo-cards');
    todoList.empty();

    const inProgressList = $('#in-progress-cards');
    inProgressList.empty();

    const doneList = $('#done-cards');
    doneList.empty();

    // ? Loop through taskList and create task cards for each status
    for (let task of taskList) {
        if (task.status === 'to-do') {
            todoList.append(createTaskCard(task));
        } else if (task.status === 'in-progress') {
            inProgressList.append(createTaskCard(task));
        } else if (task.status === 'done') {
            doneList.append(createTaskCard(task));
        }
    }

    // ? Use JQuery UI to make task cards draggable
    $('.draggable').draggable({
        opacity: 0.7,
        zIndex: 100,
        // ? This is the function that creates the clone of the card that is dragged. This is purely visual and does not affect the data.
        helper: function (e) {
            // ? Check if the target of the drag event is the card itself or a child element. If it is the card itself, clone it, otherwise find the parent card  that is draggable and clone that.
            const original = $(e.target).hasClass('ui-draggable')
                ? $(e.target)
                : $(e.target).closest('.ui-draggable');
            // ? Return the clone with the width set to the width of the original card. This is so the clone does not take up the entire width of the lane. This is to also fix a visual bug where the card shrinks as it's dragged to the right.
            return original.clone().css({
                width: original.outerWidth(),
            });
        },
    });
}

// Function to handle adding a new task
function handleAddTask(event) {
    event.preventDefault();

    // ? Read user input from the form
    const taskName = taskNameInputEl.val().trim();
    const taskDescription = taskDescriptionInputEl.val().trim();
    const taskDate = taskDateInputEl.val(); // yyyy-mm-dd format

    const newTask = {
        id: generateTaskId(),
        name: taskName,
        description: taskDescription,
        dueDate: taskDate,
        status: 'to-do',
    };

    // ? Pull the tasks from localStorage and push the new task to the array
    const taskList = readTasksFromStorage();
    taskList.push(newTask);

    // ? Save the updated tasks array to localStorage
    localStorage.setItem('tasks', JSON.stringify(taskList));

    // ? Render tasks back to the screen
    renderTaskList();

    // ? Clear the form inputs
    taskNameInputEl.val('');
    taskDescriptionInputEl.val('');
    taskDateInputEl.val('');

    //close modal
    $('#formModal').modal('hide');
}

// Function to handle deleting a task
function handleDeleteTask() {
    const taskId = $(this).attr('data-task-id');
    let taskList = readTasksFromStorage();

    // ? Remove task from the array.
    taskList = taskList.filter((task) => task.id != taskId)

    // ? We will use our helper function to save the tasks to localStorage
    localStorage.setItem('tasks', JSON.stringify(taskList));

    // ? Here we use our other function to render tasks back to the screen
    renderTaskList();
}

// Function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
    const taskList = readTasksFromStorage();

    // ? Get the task id from the event
    const taskId = ui.draggable[0].dataset.taskId;

    // ? Get the id of the lane that the card was dropped into
    const newStatus = event.target.id;

    for (let task of taskList) {
        // ? Find the task card by the `id` and update the task status.
        if (task.id === taskId) {
            task.status = newStatus;
        }
    }
    // ? Save the updated taskList array to localStorage (overwritting the previous one) and render the new task data to the screen.
    localStorage.setItem('tasks', JSON.stringify(taskList));
    renderTaskList();
}

// When the page loads, render the task list, add event listeners, make lanes droppable, and make the due date field a date picker
$(document).ready(function () {

    // ? Add event listener to the form element, listen for a submit event, and call the `handleAddTask` function.
    taskFormEl.on('submit', handleAddTask);

    renderTaskList();

    closeBtnEl.on('click', () => $('#formModal').modal('hide'));

    $('#taskDueDate').datepicker({
        changeMonth: true,
        changeYear: true,
    });

    // ? Make lanes droppable
    $('.lane').droppable({
        accept: '.draggable',
        drop: handleDrop,
    });

});
