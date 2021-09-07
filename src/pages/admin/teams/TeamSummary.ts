import { Component, Vue } from 'vue-property-decorator'

import { firestore } from '@/services/apis/firebase-facade'

@Component
export default class TeamSummaryPage extends Vue {
  entrepreneurs: unknown[] = []
  students: unknown[] = []

  private readonly entrepreneursRef = firestore.collection('teams')
    .where('category', '==', 'Entrepreneur')
    .orderBy('teamName')

  private readonly studentsRef = firestore.collection('teams')
    .where('category', '==', 'Student')
    .orderBy('teamName')

  async created(): Promise<void> {
    await this.entrepreneursRef.get()
      .then(snap => {
        snap.docs
          .map(doc => doc.data())
          .map(data => {
            data.contactName = this.titleCase(data.contactName)
            return data
          })
          .forEach(data => this.entrepreneurs.push(data))
      })

    await this.studentsRef.get()
      .then(snap => {
        snap.docs
          .map(doc => doc.data())
          .map(data => {
            data.contactName = this.titleCase(data.contactName)
            return data
          })
          .forEach(data => this.students.push(data))
      })
  }

  titleCase = (str: string): string =>
    str.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase())
}
