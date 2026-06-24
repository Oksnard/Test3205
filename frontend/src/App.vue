<script setup lang="ts">
import CreateJobForm from './components/CreateJobForm.vue';
import JobDetails from './components/JobDetails.vue';
import JobList from './components/JobList.vue';
</script>

<template>
  <div class="app">
    <header>
      <h1>URL Checker</h1>
      <p>Асинхронная проверка списка URL</p>
    </header>
    <main class="layout">
      <div class="column">
        <CreateJobForm />
        <JobList />
      </div>
      <div class="column">
        <JobDetails />
      </div>
    </main>
  </div>
</template>
