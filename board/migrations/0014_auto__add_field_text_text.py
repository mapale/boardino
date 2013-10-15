# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Text.text'
        db.add_column(u'board_text', 'text',
                      self.gf('django.db.models.fields.TextField')(null=True, blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Text.text'
        db.delete_column(u'board_text', 'text')


    models = {
        u'board.board': {
            'Meta': {'object_name': 'Board'},
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '30', 'unique': 'True', 'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'password': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'})
        },
        u'board.line': {
            'Meta': {'object_name': 'Line'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['board.Board']"}),
            'color_l': ('django.db.models.fields.TextField', [], {'default': "'000000'"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'path': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'stroke_w': ('django.db.models.fields.IntegerField', [], {})
        },
        u'board.postit': {
            'Meta': {'object_name': 'PostIt'},
            'back_color': ('django.db.models.fields.TextField', [], {'default': "'#FFFF33'"}),
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['board.Board']"}),
            'color': ('django.db.models.fields.TextField', [], {'default': "'#FFFF99'"}),
            'height': ('django.db.models.fields.IntegerField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'text': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {}),
            'x': ('django.db.models.fields.IntegerField', [], {}),
            'y': ('django.db.models.fields.IntegerField', [], {})
        },
        u'board.text': {
            'Meta': {'object_name': 'Text'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['board.Board']"}),
            'height': ('django.db.models.fields.IntegerField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'text': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {}),
            'x': ('django.db.models.fields.IntegerField', [], {}),
            'y': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['board']