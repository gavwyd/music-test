let selectedFile;
let updatedBlob;

// Load MP3 Metadata
document.getElementById('fileInput').addEventListener('change', function(event) {
    selectedFile = event.target.files[0];
    if (!selectedFile) return;

    document.getElementById('audioPlayer').src = URL.createObjectURL(selectedFile);
    document.getElementById('previewSection').style.display = 'block';

    jsmediatags.read(selectedFile, {
        onSuccess: function(tag) {
            document.getElementById('title').value = tag.tags.title || '';
            document.getElementById('artist').value = tag.tags.artist || '';
            document.getElementById('album').value = tag.tags.album || '';

            document.getElementById('previewTitle').innerText = tag.tags.title || 'Unknown';
            document.getElementById('previewArtist').innerText = tag.tags.artist || 'Unknown';
            document.getElementById('previewAlbum').innerText = tag.tags.album || 'Unknown';

            if (tag.tags.picture) {
                let base64String = `data:${tag.tags.picture.format};base64,` + btoa(String.fromCharCode(...new Uint8Array(tag.tags.picture.data)));
                document.getElementById('coverPreview').src = base64String;
                document.getElementById('previewCoverContainer').style.display = 'block';
            }
        }
    });
});

// Update MP3 Tags
function updateTags() {
    const writer = new ID3Writer(new Uint8Array(selectedFile));
    writer.setFrame('TIT2', document.getElementById('title').value)
          .setFrame('TPE1', [document.getElementById('artist').value])
          .setFrame('TALB', document.getElementById('album').value);

    const coverFile = document.getElementById('coverInput').files[0];
    if (coverFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            writer.setFrame('APIC', { type: 3, data: new Uint8Array(event.target.result), description: 'Cover Art' });
            finalizeUpdate(writer);
        };
        reader.readAsArrayBuffer(coverFile);
    } else {
        finalizeUpdate(writer);
    }
}

function finalizeUpdate(writer) {
    writer.addTag();
    updatedBlob = new Blob([writer.arrayBuffer], { type: 'audio/mp3' });
    document.getElementById('downloadButton').style.display = 'block';
}
