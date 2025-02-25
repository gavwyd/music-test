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
                document.getElementById('coverPreview').style.display = 'block';
            }
        },
        onError: function(error) {
            console.log(error);
        }
    });
});

// Function to Update MP3 Metadata
function updateTags() {
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const album = document.getElementById('album').value;
    const coverInput = document.getElementById('coverInput').files[0];

    if (!selectedFile) {
        alert("Please select an MP3 file first!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const writer = new ID3Writer(new Uint8Array(arrayBuffer));

        writer.setFrame('TIT2', title)
              .setFrame('TPE1', [artist])
              .setFrame('TALB', album);

        if (coverInput) {
            const imgReader = new FileReader();
            imgReader.onload = function(e) {
                const imageData = new Uint8Array(e.target.result);
                writer.setFrame('APIC', {
                    type: 3,
                    data: imageData,
                    description: 'Cover Art'
                });
                finalizeUpdate(writer);
            };
            imgReader.readAsArrayBuffer(coverInput);
        } else {
            finalizeUpdate(writer);
        }
    };
    reader.readAsArrayBuffer(selectedFile);
}

// Function to Finalize & Enable Download
function finalizeUpdate(writer) {
    writer.addTag();
    updatedBlob = new Blob([writer.arrayBuffer], { type: 'audio/mp3' });

    document.getElementById('downloadButton').style.display = 'block';
}

// Handle Downloading Updated MP3
document.getElementById('downloadButton').addEventListener('click', function() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(updatedBlob);
    link.download = 'updated.mp3';
    link.click();
});
