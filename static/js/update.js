document.addEventListener('DOMContentLoaded', function() {
    const updateForm = document.getElementById('updateForm');
    const deleteBtn = document.getElementById('deleteBtn');
    const deleteForm = document.getElementById('deleteForm');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phoneNumber');
    
    const originalName = nameInput.value;
    const originalPhone = phoneInput.value;
    
    function checkForChanges() {
        const nameChanged = nameInput.value !== originalName;
        const phoneChanged = phoneInput.value !== originalPhone;
        
        deleteBtn.disabled = nameChanged || phoneChanged;
    }
    
    deleteBtn.addEventListener('click', function() {
        if (!deleteBtn.disabled) {
            deleteForm.submit();
        }
    });
    
    nameInput.addEventListener('input', checkForChanges);
    phoneInput.addEventListener('input', checkForChanges);
    
    checkForChanges();
});