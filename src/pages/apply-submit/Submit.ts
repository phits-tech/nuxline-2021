import firebase from 'firebase/app'
import { extend, ValidationObserver, ValidationProvider } from 'vee-validate'
import { email, required } from 'vee-validate/dist/rules'
import { Component, Vue, Watch } from 'vue-property-decorator'

import { FieldValue, firestore, storage, Timestamp } from '@/services/apis/firebase-facade'
import uidGen from '@/services/uid-gen'

extend('email', { ...email, message: 'Must be a valid email' })
extend('required', { ...required, message: 'Required' })
extend('lineId', {
  validate: value => value.match(/[A-Za-z]/),
  message: 'Must be an ID (not a phone number)'
})

@Component({ components: { ValidationProvider, ValidationObserver } })
export default class ApplySubmitPage extends Vue {
  // Data & State
  formTeamName = ''
  formContactName = ''
  formLine = ''
  formEmail = ''
  formCategory = 'Entrepreneur'
  formPresentation: File | null = null
  formPresentationUrl: string | null = null

  stateAcceptingApplications = false
  stateUploadingProgress = 0
  stateSubmitting = false

  // Internal
  private readonly randomKey = uidGen()
  private uploadTaskPres: firebase.storage.UploadTask | null = null

  // Events
  @Watch('formPresentation')
  onPresentationChanged(updatedValue: File | null, oldValue: File | null): void {
    if (updatedValue) this.uploadPresentation(updatedValue)
    if (oldValue) this.deletePresentation(oldValue)
  }

  // Methods
  getPresentationStorageRef(file: File): string {
    return `/presentations/${this.randomKey}-${file.name}`
  }

  uploadPresentation(file: File): void {
    if (!this.stateAcceptingApplications) return

    // Validation
    const maxSize = 10
    if (file.size > (maxSize * 1_000_000)) {
      this.clearPresentationFile()
      this.$buefy.notification.open(`Presentation must be less than ${maxSize}MB`)
      return
    }

    if (!file.name.toLowerCase().endsWith('pdf')) {
      this.clearPresentationFile()
      this.$buefy.notification.open('Presentations must be PDF format')
      return
    }

    // Save to Firebase Storage
    const task = storage.ref(this.getPresentationStorageRef(file)).put(file)
    this.stateUploadingProgress = 0
    this.uploadTaskPres = task

    task.on(
      'state_changed',
      snap => { // onUpdate
        this.stateUploadingProgress = Math.floor(snap.bytesTransferred / snap.totalBytes * 95)
      },
      err => { // onError
        this.clearPresentationFile()
        // Error type doesn't expose code :/
        if (!err.message.includes('canceled')) this.$buefy.notification.open('Upload failed')
      },
      () => { // onComplete
        task.snapshot.ref.getDownloadURL()
          .then(url => {
            this.formPresentationUrl = url
            this.stateUploadingProgress = 100
          })
          .catch(_ => {
            this.clearPresentationFile()
            this.$buefy.notification.open('Upload failed')
          })
      }
    )
  }

  deletePresentation(file: File): void {
    if (this.formPresentationUrl) {
      storage.ref(this.getPresentationStorageRef(file)).delete().catch(_ => {
        // Ignore error
      })
    } else if (this.uploadTaskPres) {
      this.uploadTaskPres.cancel()
    }

    this.clearPresentationFile()
  }

  clearPresentationFile(): void {
    // Reset all upload fields
    this.formPresentation = null
    this.formPresentationUrl = null
    this.stateUploadingProgress = 0
    this.uploadTaskPres = null
  }

  async submit(): Promise<unknown> {
    if (!this.stateAcceptingApplications) return

    // Finish file uploads first
    if (this.formPresentation && !this.formPresentationUrl) {
      this.$buefy.notification.open('Please wait for file upload to complete')
      return
    }

    this.stateSubmitting = true

    // Data
    const lineIdClean = this.formLine.replace('@', '').toLowerCase()

    const update = {
      updated: FieldValue.serverTimestamp(),
      updates: FieldValue.arrayUnion(Timestamp.now()),
      teamName: this.formTeamName,
      contactName: this.formContactName,
      lineId: lineIdClean,
      email: this.formEmail,
      category: this.formCategory,
      presentation: this.formPresentationUrl,
      presentations: FieldValue.arrayUnion(this.formPresentationUrl)
    }

    // Save to Firestore
    return await firestore
      .collection('teams').doc(lineIdClean)
      .set(update, { merge: true })
      .then(async () => await this.$router.push('confirm'))
      .catch(_ => {
        this.$buefy.notification.open('Could not submit :(')
        this.stateSubmitting = false
      })
  }
}
