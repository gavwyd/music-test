let selectedFile;
let updatedBlob;

// Handle File Selection
document.getElementById('fileInput').addEventListener('change', function(event) {
    selectedFile = event.target.files[0];
    if (!selectedFile) return;

    document.getElementById('audioPlayer').src = URL.createObjectURL(selectedFile);
    document.getElementById('previewSection').style.display = 'block';

    // Read Existing Metadata
    jsmediatags.read(selectedFile, {
        onSuccess: function(tag) {
            document.getElementById('title').value = tag.tags.title || '';
            document.getElementById('artist').value = tag.tags.artist || '';
            document.getElementById('album').value = tag.tags.album || '';
            document.getElementById('previewTitle').innerText = tag.tags.title || 'Unknown';
            document.getElementById('previewArtist').innerText = tag.tags.artist || 'Unknown';
            document.getElementById('previewAlbum').innerText = tag.tags.album || 'Unknown';

            // Load Cover Image if Available
            if (tag.tags.picture) {
                let base64String = "data:" + tag.tags.picture.format + ";base64," +
                    btoa(new Uint8Array(tag.tags.picture.data).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                document.getElementById('coverPreview').src = base64String;
                document.getElementById('previewCoverContainer').style.display = 'block';
            }
        },
        onError: function(error) {
            console.log(error);
        }
    });
});

// Handle Cover Image Preview
document.getElementById('coverInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('coverPreview').src = e.target.result;
            document.getElementById('previewCoverContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});
