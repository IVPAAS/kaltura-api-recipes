<p>Uploaded file <?php echo $result->fileName ?>. Creating entry...</p>
<div class="CreatedEntry"></div>
<script>
  var element = $('.CreatedEntry').last();
  element[0].loadData = function() {
    $('.CreatedEntry').last().load('addFromUploadedFileBaseEntry.php', {
       name: $result->fileName,
       uploadTokenId: $result->id,
    });
  }
  element[0].loadData();
</script>